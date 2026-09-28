'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  FileText,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  active_clients: number;
  prospect_clients: number;
  pending_returns: number;
  team_members: number;
  total_revenue_mtd: number;
  completed_returns_mtd: number;
}

interface ChartDataPoint {
  name: string;
  value?: number;
  count?: number;
  revenue?: number;
  [key: string]: any;
}

const AdvisorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch organization stats
    const fetchStats = async () => {
      try {
        // This will be connected to the real API
        setStats({
          active_clients: 127,
          prospect_clients: 34,
          pending_returns: 12,
          team_members: 6,
          total_revenue_mtd: 45230,
          completed_returns_mtd: 23,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Chart data
  const revenueData: ChartDataPoint[] = [
    { name: 'Jan', revenue: 12000 },
    { name: 'Feb', revenue: 19000 },
    { name: 'Mar', revenue: 28000 },
    { name: 'Apr', revenue: 25000 },
    { name: 'May', revenue: 31000 },
    { name: 'Jun', revenue: 35000 },
    { name: 'Jul', revenue: 42000 },
    { name: 'Aug', revenue: 38000 },
    { name: 'Sep', revenue: 45000 },
  ];

  const returnStatusData: ChartDataPoint[] = [
    { name: 'Draft', value: 12 },
    { name: 'Review', value: 8 },
    { name: 'Filed', value: 156 },
    { name: 'Accepted', value: 142 },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Clients */}
        <KPICard
          title="Active Clients"
          value={stats?.active_clients || 0}
          icon={<Users className="text-blue-600" size={32} />}
          trend={12}
          trendLabel="from last month"
        />

        {/* Pending Returns */}
        <KPICard
          title="Pending Returns"
          value={stats?.pending_returns || 0}
          icon={<FileText className="text-red-600" size={32} />}
          trend={-3}
          trendLabel="overdue items"
        />

        {/* MTD Revenue */}
        <KPICard
          title="Revenue (MTD)"
          value={`$${(stats?.total_revenue_mtd || 0).toLocaleString()}`}
          icon={<DollarSign className="text-green-600" size={32} />}
          trend={18}
          trendLabel="vs last month"
        />

        {/* Team Members */}
        <KPICard
          title="Team Members"
          value={stats?.team_members || 0}
          icon={<Users className="text-purple-600" size={32} />}
          trend={1}
          trendLabel="active"
        />

        {/* Completed Returns */}
        <KPICard
          title="Returns Completed (MTD)"
          value={stats?.completed_returns_mtd || 0}
          icon={<CheckMarkIcon className="text-green-600" size={32} />}
          trend={23}
          trendLabel="vs last month"
        />

        {/* Compliance Alerts */}
        <KPICard
          title="Compliance Alerts"
          value={5}
          icon={<AlertCircle className="text-yellow-600" size={32} />}
          trend={-2}
          trendLabel="critical"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Return Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Return Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={returnStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          <ActivityItem
            title="Tax return filed for John Doe"
            time="2 hours ago"
            type="filed"
          />
          <ActivityItem
            title="Invoice sent to Acme Corp"
            time="4 hours ago"
            type="invoice"
          />
          <ActivityItem
            title="Team member Sarah joined the organization"
            time="1 day ago"
            type="team"
          />
          <ActivityItem
            title="Compliance alert: Q3 estimated taxes due"
            time="2 days ago"
            type="compliance"
          />
          <ActivityItem
            title="New client prospect: Tech Startup LLC"
            time="3 days ago"
            type="prospect"
          />
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-orange-600" size={24} />
          <h3 className="text-lg font-bold text-gray-900">
            Upcoming Deadlines
          </h3>
        </div>
        <div className="space-y-3">
          <DeadlineItem
            client="John Smith"
            deadline="Oct 15, 2026"
            days={17}
            priority="high"
          />
          <DeadlineItem
            client="Acme Corporation"
            deadline="Oct 20, 2026"
            days={22}
            priority="medium"
          />
          <DeadlineItem
            client="Jane Doe"
            deadline="Oct 30, 2026"
            days={32}
            priority="low"
          />
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: number;
  trendLabel: string;
}

const KPICard = ({ title, value, icon, trend, trendLabel }: KPICardProps) => {
  const isPositive = trend >= 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p
            className={`text-sm mt-2 ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span className="font-semibold">
              {isPositive ? '+' : '-'} {Math.abs(trend)}%
            </span>{' '}
            {trendLabel}
          </p>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
      </div>
    </div>
  );
};

const CheckMarkIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface ActivityItemProps {
  title: string;
  time: string;
  type: string;
}

const ActivityItem = ({ title, time, type }: ActivityItemProps) => {
  const getIcon = (type: string) => {
    const iconProps = { size: 16 };
    switch (type) {
      case 'filed':
        return <FileText {...iconProps} className="text-green-600" />;
      case 'invoice':
        return <DollarSign {...iconProps} className="text-blue-600" />;
      case 'team':
        return <Users {...iconProps} className="text-purple-600" />;
      case 'compliance':
        return <AlertCircle {...iconProps} className="text-orange-600" />;
      case 'prospect':
        return <TrendingUp {...iconProps} className="text-blue-600" />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  return (
    <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
      <div className="flex-shrink-0">{getIcon(type)}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

interface DeadlineItemProps {
  client: string;
  deadline: string;
  days: number;
  priority: 'high' | 'medium' | 'low';
}

const DeadlineItem = ({
  client,
  deadline,
  days,
  priority,
}: DeadlineItemProps) => {
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{client}</p>
        <p className="text-sm text-gray-600">{deadline}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{days} days</span>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(priority)}`}>
          {priority}
        </span>
      </div>
    </div>
  );
};

export default AdvisorDashboard;
