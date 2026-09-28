import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/advisor/tasks
export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    const assignedTo = request.nextUrl.searchParams.get('assigned_to');
    const status = request.nextUrl.searchParams.get('status');
    const clientId = request.nextUrl.searchParams.get('client_id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('advisor_tasks')
      .select(`
        *,
        assigned_to:advisor_team_members(full_name),
        client:advisor_clients(first_name, last_name)
      `)
      .eq('organization_id', orgId);

    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (status) query = query.eq('status', status);
    if (clientId) query = query.eq('client_id', clientId);

    query = query.order('due_date', { ascending: true });

    const { data: tasks, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/advisor/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      client_id,
      return_id,
      title,
      description,
      category = 'general',
      assigned_to,
      due_date,
      priority = 'normal',
      created_by,
    } = body;

    if (!organization_id || !title || !assigned_to) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('advisor_tasks')
      .insert({
        organization_id,
        client_id,
        return_id,
        title,
        description,
        category,
        assigned_to,
        due_date,
        priority,
        created_by,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT /api/advisor/tasks/[id]
export async function PUT(request: NextRequest) {
  try {
    const taskId = request.nextUrl.pathname.split('/').pop();
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data: task, error } = await supabase
      .from('advisor_tasks')
      .update(body)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
