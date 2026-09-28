import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/integrations/disconnect
 * Disconnect an integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID required' },
        { status: 400 }
      );
    }

    const status = integrationManager.getStatus(userId, integrationId);
    if (!status) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    integrationManager.disconnect(userId, integrationId);

    return NextResponse.json({
      success: true,
      message: 'Integration disconnected successfully',
      data: {
        integrationId,
        status: 'disconnected',
      },
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Disconnect failed', message: String(error) },
      { status: 500 }
    );
  }
}
