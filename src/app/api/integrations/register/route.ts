import { integrationManager } from '@/lib/integrations/integration-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/register
 * Register a new integration with OAuth credentials
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const {
      integrationId,
      type,
      credentials,
      metadata,
      autoStart = false,
    } = await request.json();

    if (!integrationId || !type || !credentials?.accessToken) {
      return NextResponse.json(
        { error: 'Integration ID, type, and credentials required' },
        { status: 400 }
      );
    }

    // Test connection before registering
    const testResult = await integrationManager.testConnection(
      userId,
      integrationId,
      type,
      credentials.accessToken
    );

    if (!testResult.success) {
      return NextResponse.json(
        { error: 'Connection test failed', message: testResult.message },
        { status: 400 }
      );
    }

    // Register integration
    integrationManager.registerIntegration(userId, integrationId, type, credentials, metadata);

    // Auto-start sync if requested
    if (autoStart) {
      integrationManager.startSync(userId, integrationId);
    }

    return NextResponse.json({
      success: true,
      message: 'Integration registered successfully',
      data: {
        integrationId,
        type,
        status: autoStart ? 'syncing' : 'connected',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/register
 * Update integration credentials
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '';
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { integrationId, credentials } = await request.json();

    if (!integrationId || !credentials?.accessToken) {
      return NextResponse.json(
        { error: 'Integration ID and credentials required' },
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

    // Update credentials in sync engine
    const syncEngine = integrationManager.getSyncEngine();
    syncEngine.updateToken(
      userId,
      integrationId,
      credentials.accessToken,
      credentials.expiresIn || 3600
    );

    return NextResponse.json({
      success: true,
      message: 'Credentials updated successfully',
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Update failed', message: String(error) },
      { status: 500 }
    );
  }
}
