import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/advisor/returns
// List tax returns with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    const clientId = request.nextUrl.searchParams.get('client_id');
    const status = request.nextUrl.searchParams.get('status');
    const taxYear = request.nextUrl.searchParams.get('tax_year');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!orgId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('advisor_tax_returns')
      .select(
        `
        *,
        client:advisor_clients(first_name, last_name, email),
        assigned_to:advisor_team_members(full_name)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId);

    if (clientId) query = query.eq('client_id', clientId);
    if (status) query = query.eq('status', status);
    if (taxYear) query = query.eq('tax_year', parseInt(taxYear));

    // Order by due date
    query = query.order('due_date', { ascending: true });

    const offset = (page - 1) * limit;
    const { data: returns, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) throw error;

    return NextResponse.json({
      data: returns,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// POST /api/advisor/returns
// Create a new tax return
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      client_id,
      tax_year,
      return_type,
      due_date,
      assigned_to,
    } = body;

    if (
      !organization_id ||
      !client_id ||
      !tax_year ||
      !return_type
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if return already exists
    const { data: existing } = await supabase
      .from('advisor_tax_returns')
      .select('id')
      .eq('client_id', client_id)
      .eq('tax_year', tax_year)
      .eq('return_type', return_type)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Return already exists for this client and tax year' },
        { status: 409 }
      );
    }

    const { data: taxReturn, error } = await supabase
      .from('advisor_tax_returns')
      .insert({
        organization_id,
        client_id,
        tax_year,
        return_type,
        due_date,
        assigned_to,
        status: 'intake',
        priority: 'normal',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(taxReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return' },
      { status: 500 }
    );
  }
}

// PUT /api/advisor/returns/[id]
// Update a tax return
export async function PUT(request: NextRequest) {
  try {
    const returnId = request.nextUrl.pathname.split('/').pop();
    if (!returnId) {
      return NextResponse.json(
        { error: 'Return ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data: taxReturn, error } = await supabase
      .from('advisor_tax_returns')
      .update(body)
      .eq('id', returnId)
      .select()
      .single();

    if (error) throw error;

    // Log the update in audit trail
    await supabase.from('advisor_audit_log').insert({
      organization_id: body.organization_id,
      action: 'updated',
      resource_type: 'tax_return',
      resource_id: returnId,
      new_values: body,
    });

    return NextResponse.json(taxReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}
