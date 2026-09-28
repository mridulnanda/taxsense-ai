import { NextRequest, NextResponse } from 'next/server';
import pino from 'pino';
import crypto from 'crypto';
import {
  HdfcBankConnect,
  IciciOpenAPI,
  AxisBankConnect,
  SbiConnect,
  KotakMahindraBank,
  IdfcBankAPI,
} from '@/lib/integrations/banks';
import { DataSyncEngine, WebhookHandler } from '@/lib/integrations/sync-engine';

const logger = pino();
const syncEngine = new DataSyncEngine();
const webhookHandler = new WebhookHandler(syncEngine);

/**
 * Handle bank transaction webhooks from various banks
 * POST /api/webhooks/bank
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-signature');
    const bankType = request.headers.get('x-bank-type');

    if (!bankType || !signature) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    const bodyString = JSON.stringify(body);

    // Validate based on bank type
    let isValid = false;

    switch (bankType.toLowerCase()) {
      case 'hdfc':
        isValid = validateHdfcSignature(bodyString, signature);
        break;
      case 'icici':
        isValid = validateIciciSignature(bodyString, signature);
        break;
      case 'axis':
        isValid = validateAxisSignature(bodyString, signature);
        break;
      case 'sbi':
        isValid = validateSbiSignature(bodyString, signature);
        break;
      case 'kotak':
        isValid = validateKotakSignature(bodyString, signature);
        break;
      case 'idfc':
        isValid = validateIdfcSignature(bodyString, signature);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown bank type' },
          { status: 400 }
        );
    }

    if (!isValid) {
      logger.warn(
        { bankType, body },
        'Invalid webhook signature'
      );
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract user ID and integration ID from webhook payload
    const userId = body.userId || body.user_id;
    const integrationId = body.integrationId || body.integration_id;

    if (!userId || !integrationId) {
      return NextResponse.json(
        { error: 'Missing userId or integrationId' },
        { status: 400 }
      );
    }

    // Handle webhook by bank type
    await webhookHandler.handleBankWebhook(userId, integrationId, body);

    logger.info(
      { bankType, userId, integrationId, eventType: body.type },
      'Bank webhook processed successfully'
    );

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error({ error }, 'Bank webhook processing failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Bank-specific signature validators
 */

function validateHdfcSignature(payload: string, signature: string): boolean {
  const secret = process.env.HDFC_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

function validateIciciSignature(payload: string, signature: string): boolean {
  const secret = process.env.ICICI_API_KEY || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

function validateAxisSignature(payload: string, signature: string): boolean {
  const secret = process.env.AXIS_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

function validateSbiSignature(payload: string, signature: string): boolean {
  const secret = process.env.SBI_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

function validateKotakSignature(payload: string, signature: string): boolean {
  const secret = process.env.KOTAK_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

function validateIdfcSignature(payload: string, signature: string): boolean {
  const secret = process.env.IDFC_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
