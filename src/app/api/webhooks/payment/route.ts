import { NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import crypto from 'crypto';
import {
  RazorpayIntegration,
  PhonePeUPI,
  StripePayment,
  InstamojoIntegration,
} from '@/lib/integrations/fintech';
import { DataSyncEngine, WebhookHandler } from '@/lib/integrations/sync-engine';

const logger = pino();
const syncEngine = new DataSyncEngine();
const webhookHandler = new WebhookHandler(syncEngine);

/**
 * Handle payment platform webhooks
 * POST /api/webhooks/payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-signature');
    const provider = request.headers.get('x-provider');

    if (!provider || !signature) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    const bodyString = JSON.stringify(body);

    // Validate based on payment provider
    let isValid = false;
    let userId: string | undefined;
    let integrationId: string | undefined;

    switch (provider.toLowerCase()) {
      case 'razorpay':
        isValid = validateRazorpaySignature(bodyString, signature);
        userId = body.payload?.payment?.entity?.customer_id;
        integrationId = 'razorpay';
        break;

      case 'phonepe':
        isValid = validatePhonePeSignature(bodyString, signature);
        userId = body.data?.merchantTransactionId?.split('-')[0];
        integrationId = 'phonepe';
        break;

      case 'stripe':
        isValid = validateStripeSignature(bodyString, signature);
        userId = body.data?.object?.customer;
        integrationId = 'stripe';
        break;

      case 'instamojo':
        isValid = validateInstamojoSignature(bodyString, signature);
        userId = body.payment_request_id?.split('-')[0];
        integrationId = 'instamojo';
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown payment provider' },
          { status: 400 }
        );
    }

    if (!isValid) {
      logger.warn(
        { provider, body },
        'Invalid payment webhook signature'
      );
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!userId || !integrationId) {
      logger.warn(
        { provider, body },
        'Missing userId or integrationId in webhook'
      );
      return NextResponse.json(
        { error: 'Missing user context' },
        { status: 400 }
      );
    }

    // Handle webhook
    await webhookHandler.handlePaymentWebhook(userId, integrationId, body);

    logger.info(
      { provider, userId, integrationId, eventType: body.type },
      'Payment webhook processed successfully'
    );

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error({ error }, 'Payment webhook processing failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Payment provider signature validators
 */

function validateRazorpaySignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

function validatePhonePeSignature(
  payload: string,
  signature: string
): boolean {
  const saltKey = process.env.PHONEPE_SALT_KEY || '';
  const hash = crypto
    .createHash('sha256')
    .update(payload + saltKey)
    .digest('hex');

  const [receivedHash] = signature.split('###');
  return hash === receivedHash;
}

function validateStripeSignature(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  const timestampedHash = `t=${Math.floor(Date.now() / 1000)},v1=${hash}`;
  const signatureParts = signature.split(',');

  for (const part of signatureParts) {
    if (part.startsWith('v1=')) {
      const receivedHash = part.substring(3);
      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(receivedHash)
      );
    }
  }

  return false;
}

function validateInstamojoSignature(
  payload: string,
  signature: string
): boolean {
  const apiKey = process.env.INSTAMOJO_API_KEY || '';
  const body = JSON.parse(payload);

  const messageString = `${body.payment_request_id}|${body.payment_id}|${body.status}`;
  const hash = crypto
    .createHmac('sha256', apiKey)
    .update(messageString)
    .digest('hex');

  return hash === signature;
}
