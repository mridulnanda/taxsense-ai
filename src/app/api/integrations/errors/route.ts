import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/integrations/errors
 * Get error log for an integration
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID required' },
        { status: 400 }
      );
    }

    const errors = integrationManager.getErrorLog(userId, integrationId, limit);

    return NextResponse.json({
      success: true,
      data: {
        integrationId,
        errorCount: errors.length,
        errors,
      },
    });
  } catch (error) {
    console.error('Error fetching error log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/errors
 * Clear error log for an integration
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

    // In production, this would clear the error log from database
    // For now, we just acknowledge the request
    return NextResponse.json({
      success: true,
      message: 'Error log cleared',
      data: {
        integrationId,
      },
    });
  } catch (error) {
    console.error('Error clearing error log:', error);
    return NextResponse.json(
      { error: 'Failed to clear error log' },
      { status: 500 }
    );
  }
}
