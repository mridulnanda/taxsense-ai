'use client';

import React, { useState } from 'react';
import { Plus, Clock, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  client: string;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string;
  assigned_to: string;
  category: string;
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Prepare K-1 for Jane Smith',
      client: 'Jane Smith',
      status: 'in_progress',
      priority: 'high',
      due_date: '2026-09-30',
      assigned_to: 'Sarah Johnson',
      category: 'preparation',
    },
    {
      id: '2',
      title: 'Review estimated taxes',
      client: 'Acme Corp',
      status: 'open',
      priority: 'urgent',
      due_date: '2026-09-25',
      assigned_to: 'Mike Wilson',
      category: 'review',
    },
    {
      id: '3',
      title: 'Send Q3 estimated tax letters',
      client: 'All Clients',
      status: 'open',
      priority: 'normal',
      due_date: '2026-09-15',
      assigned_to: 'Sarah Johnson',
      category: 'filing',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="text-orange-600" size={20} />;
      case 'in_progress':
        return <Clock className="text-blue-600" size={20} />;
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Tasks</h2>
          <p className="text-gray-600 mt-1">{tasks.filter(t => t.status !== 'completed').length} active tasks</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input type="text" placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <input type="checkbox" className="mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">📎 {task.client}</span>
                    <span className="flex items-center gap-1">👤 {task.assigned_to}</span>
                    <span className="flex items-center gap-1">📅 {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {getStatusIcon(task.status)}
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
