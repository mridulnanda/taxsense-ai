import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/integrations/status
 * Get all integrations and their status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const integrations = integrationManager.getAllIntegrations(userId);
    const stats = integrationManager.getStatistics(userId);

    return NextResponse.json({
      success: true,
      data: {
        integrations,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Error getting integration status:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}
