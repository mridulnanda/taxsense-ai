import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/schedule
 * Set sync schedule for an integration
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { integrationId, frequency } = await request.json();

    if (!integrationId || !frequency) {
      return NextResponse.json(
        { error: 'Integration ID and frequency required' },
        { status: 400 }
      );
    }

    const validFrequencies = ['realtime', 'hourly', 'daily', 'weekly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 }
      );
    }

    integrationManager.setSyncSchedule(userId, integrationId, frequency);

    return NextResponse.json({
      success: true,
      message: 'Sync schedule updated successfully',
      data: {
        integrationId,
        frequency,
      },
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/schedule
 * Get sync schedule for an integration
 */
export async function GET(request: NextRequest) {
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

    // In production, would fetch from database
    const schedule = {
      integrationId,
      frequency: 'daily',
      enabled: true,
      nextRun: new Date(Date.now() + 3600000).toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to get schedule' },
      { status: 500 }
    );
  }
}
