import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/advisor/reports
export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    const clientId = request.nextUrl.searchParams.get('client_id');
    const reportType = request.nextUrl.searchParams.get('type');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!orgId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('advisor_reports')
      .select(
        `
        *,
        client:advisor_clients(first_name, last_name, email),
        template:advisor_report_templates(name, category)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId);

    if (clientId) query = query.eq('client_id', clientId);
    if (reportType) query = query.eq('report_type', reportType);

    query = query.order('created_at', { ascending: false });

    const offset = (page - 1) * limit;
    const { data: reports, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) throw error;

    return NextResponse.json({
      data: reports,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/advisor/reports
// Generate a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      client_id,
      return_id,
      title,
      report_type,
      template_id,
      report_data,
      generated_by,
    } = body;

    if (!organization_id || !title || !report_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get organization for branding
    const { data: org } = await supabase
      .from('advisor_organizations')
      .select('*')
      .eq('id', organization_id)
      .single();

    // Render HTML from template with data
    const { data: template } = await supabase
      .from('advisor_report_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    // Generate HTML by replacing placeholders
    let generatedHtml = template?.template_html || '';
    if (report_data) {
      Object.entries(report_data).forEach(([key, value]) => {
        generatedHtml = generatedHtml.replace(
          new RegExp(`{{${key}}}`, 'g'),
          String(value)
        );
      });
    }

    const { data: report, error } = await supabase
      .from('advisor_reports')
      .insert({
        organization_id,
        client_id,
        return_id,
        title,
        report_type,
        template_id,
        report_data,
        generated_html: generatedHtml,
        generated_by,
      })
      .select()
      .single();

    if (error) throw error;

    // Log analytics event
    await supabase.from('advisor_analytics_events').insert({
      organization_id,
      user_id: generated_by,
      event_name: 'report_generated',
      event_type: 'report_generated',
      resource_type: 'report',
      resource_id: report.id,
      metadata: { report_type, client_id },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
