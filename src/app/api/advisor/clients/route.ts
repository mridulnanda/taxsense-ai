import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/advisor/clients
// List all clients for an organization
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const orgId = request.nextUrl.searchParams.get('organization_id');
    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!authHeader || !orgId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let query = supabase
      .from('advisor_clients')
      .select(
        `
        *,
        primary_advisor:advisor_team_members(full_name),
        returns:advisor_tax_returns(count)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: clients, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: clients,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/advisor/clients
// Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      first_name,
      last_name,
      email,
      phone,
      client_type = 'individual',
      industry,
      annual_income,
      segments = ['general'],
      tags = [],
      communication_preference = 'email',
    } = body;

    if (!organization_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from('advisor_clients')
      .insert({
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        client_type,
        industry,
        annual_income,
        segments,
        tags,
        communication_preference,
        status: 'prospect',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

// PUT /api/advisor/clients/[id]
// Update a client
export async function PUT(request: NextRequest) {
  try {
    const clientId = request.nextUrl.pathname.split('/').pop();
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data: client, error } = await supabase
      .from('advisor_clients')
      .update(body)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/advisor/clients/[id]
// Soft delete a client
export async function DELETE(request: NextRequest) {
  try {
    const clientId = request.nextUrl.pathname.split('/').pop();
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('advisor_clients')
      .update({ status: 'churned' })
      .eq('id', clientId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
