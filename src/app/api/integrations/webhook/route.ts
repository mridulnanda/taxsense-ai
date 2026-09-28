import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/webhook
 * Handle webhook notifications from integrated services
 * Signature verification for security
 */
export async function POST(request: NextRequest) {
  try {
    // Extract webhook signature from headers
    const signature = request.headers.get('x-webhook-signature') || '';
    const secret = request.headers.get('x-webhook-secret') || '';

    if (!signature || !secret) {
      return NextResponse.json(
        { error: 'Webhook signature or secret missing' },
        { status: 401 }
      );
    }

    const { userId, integrationId } = await request.json();

    if (!userId || !integrationId) {
      return NextResponse.json(
        { error: 'User ID and integration ID required' },
        { status: 400 }
      );
    }

    // Parse payload
    const payload = await request.json();

    // Handle webhook
    await integrationManager.handleWebhook(userId, integrationId, payload, signature, secret);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/webhook/test
 * Test webhook configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { integrationId, webhookUrl, secret } = await request.json();

    if (!integrationId || !webhookUrl || !secret) {
      return NextResponse.json(
        { error: 'Integration ID, webhook URL, and secret required' },
        { status: 400 }
      );
    }

    // In production, this would register the webhook with the service
    // and perform a test fire
    console.log(`Testing webhook for ${integrationId} at ${webhookUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook test initiated',
      data: {
        integrationId,
        webhookUrl,
        status: 'testing',
      },
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: 'Webhook test failed', message: String(error) },
      { status: 500 }
    );
  }
}
