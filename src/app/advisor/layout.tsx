import React from 'react';
import Link from 'next/link';
import { BarChart3, Users, FileText, CheckSquare, ReceiptText, AlertCircle, Settings, LogOut } from 'lucide-react';

const AdvisorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">TaxSense</h1>
          <p className="text-sm text-gray-600 mt-1">Advisor Portal</p>
        </div>

        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <NavItem
            href="/advisor/dashboard"
            icon={<BarChart3 size={20} />}
            label="Dashboard"
          />

          {/* Client Management */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-3">
              Clients
            </p>
          </div>
          <NavItem
            href="/advisor/clients"
            icon={<Users size={20} />}
            label="Client Directory"
          />

          {/* Tax Returns */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-3">
              Returns
            </p>
          </div>
          <NavItem
            href="/advisor/returns"
            icon={<FileText size={20} />}
            label="Tax Returns"
          />

          {/* Reports */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-3">
              Reports & Planning
            </p>
          </div>
          <NavItem
            href="/advisor/reports"
            icon={<ReceiptText size={20} />}
            label="Reports"
          />

          {/* Tasks */}
          <NavItem
            href="/advisor/tasks"
            icon={<CheckSquare size={20} />}
            label="Tasks"
          />

          {/* Compliance */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-3">
              Compliance
            </p>
          </div>
          <NavItem
            href="/advisor/compliance"
            icon={<AlertCircle size={20} />}
            label="Compliance Alerts"
          />

          {/* Team & Billing */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-3">
              Admin
            </p>
          </div>
          <NavItem
            href="/advisor/team"
            icon={<Users size={20} />}
            label="Team Management"
          />
          <NavItem
            href="/advisor/billing"
            icon={<ReceiptText size={20} />}
            label="Billing & Invoices"
          />

          {/* Settings */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-3">
              Settings
            </p>
          </div>
          <NavItem
            href="/advisor/settings"
            icon={<Settings size={20} />}
            label="Settings"
          />
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Advisor Portal</h1>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 1118 14.158V11m-6 4v6m0 0v6m0-6H9m6 0h6" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">AD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ href, icon, label }: NavItemProps) => {
  return (
    <Link href={href}>
      <span className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </span>
    </Link>
  );
};

export default AdvisorLayout;
