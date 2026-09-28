import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/sync
 * Trigger manual sync for an integration
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { integrationId } = await request.json();
    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID required' },
        { status: 400 }
      );
    }

    const result = await integrationManager.triggerSync(userId, integrationId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/sync/[integrationId]
 * Get sync history for an integration
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID required' },
        { status: 400 }
      );
    }

    const history = integrationManager.getSyncHistory(userId, integrationId, limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting sync history:', error);
    return NextResponse.json(
      { error: 'Failed to get sync history' },
      { status: 500 }
    );
  }
}
