"use client";

/**
 * Support & Feedback Dashboard
 * Tickets, feedback, escalations
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function SupportPage() {
  const [selectedTab, setSelectedTab] = useState<"tickets" | "feedback">("tickets");

  const { data: tickets = [] } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () =>
      fetch("/api/admin/support/tickets").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const openTickets = tickets.filter((t: any) => t.status !== "closed");
  const urgentTickets = tickets.filter((t: any) => t.priority === "urgent");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
          <p className="text-gray-600 mt-1">Tickets, feedback, and user issues</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-blue-100 text-blue-900 rounded-lg font-semibold">
            {openTickets.length} Open
          </div>
          <div className="px-4 py-2 bg-red-100 text-red-900 rounded-lg font-semibold">
            {urgentTickets.length} Urgent
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: tickets.length },
          { label: "Avg Response Time", value: "2.4 hrs" },
          { label: "Resolution Rate", value: "94.2%" },
          { label: "CSAT Score", value: "4.7/5" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab("tickets")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === "tickets"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Support Tickets
        </button>
        <button
          onClick={() => setSelectedTab("feedback")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === "feedback"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          User Feedback
        </button>
      </div>

      {/* Content */}
      {selectedTab === "tickets" && <TicketsList tickets={tickets} />}
      {selectedTab === "feedback" && <FeedbackList />}
    </div>
  );
}

function TicketsList({ tickets }: { tickets: any[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Ticket</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tickets.slice(0, 5).map((ticket: any, idx: number) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{ticket.title}</p>
                <p className="text-xs text-gray-500 mt-1">{ticket.description?.slice(0, 50)}</p>
              </td>
              <td className="py-3 px-4 text-gray-600">{ticket.user || "Support"}</td>
              <td className="py-3 px-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {ticket.status || "open"}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === "urgent"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {ticket.priority || "medium"}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{ticket.created_at || "2h ago"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackList() {
  const feedback = [
    { type: "feature_request", title: "CSV Export Feature", rating: 5, user: "User123" },
    { type: "bug", title: "PDF Generation Issue", rating: 2, user: "User456" },
    { type: "improvement", title: "UI/UX Suggestions", rating: 4, user: "User789" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {feedback.map((item, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              item.type === "bug"
                ? "bg-red-100 text-red-800"
                : item.type === "feature_request"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
            }`}>
              {item.type}
            </span>
            <span className="text-lg">{"⭐".repeat(item.rating)}</span>
          </div>
          <p className="font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500 mt-2">{item.user}</p>
        </div>
      ))}
    </div>
  );
}
