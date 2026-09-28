import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/advisor/organizations
// List all organizations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizations where user is a team member
    const { data: organizations, error } = await supabase
      .from('advisor_organizations')
      .select(`
        *,
        team_members:advisor_team_members(count),
        clients:advisor_clients(count)
      `)
      .in('id', supabase.rpc('get_user_organizations', { user_id: user.id }));

    if (error) throw error;

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/advisor/organizations
// Create a new organization
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      country,
      industry,
      subscription_tier = 'starter',
      billing_email,
      billing_phone,
    } = body;

    // Validate required fields
    if (!name || !slug || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('advisor_organizations')
      .insert({
        name,
        slug,
        country,
        industry,
        subscription_tier,
        billing_email,
        billing_phone,
        created_by: user.id,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add creator as partner
    const { error: memberError } = await supabase
      .from('advisor_team_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        role: 'partner',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
