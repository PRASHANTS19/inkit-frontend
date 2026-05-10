import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Briefcase,
  Calendar,
  Receipt,
  Clock,
  FileText,
  Users,
  AlertTriangle
} from "lucide-react";

import QuickStats from "../components/dashboard/QuickStats";
import RecentCases from "../components/dashboard/RecentCases";
import UpcomingHearings from "../components/dashboard/UpcomingHearings";
import PendingTasks from "../components/dashboard/PendingTasks";
import AssociatesList from "../components/dashboard/AssociatesList";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const safeQuery = async (promiseFactory, fallback = []) => {
    try {
      return await promiseFactory();
    } catch (e) {
      if (e?.status === 403 || e?.status === 404) {
        return fallback;
      }
      throw e;
    }
  };

  // Load user data first
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  // Load dashboard data in parallel with optimized limits
  const { data: dashboardData, isLoading: isLoadingData, error } = useQuery({
    queryKey: ['dashboardData', user?.id, user?.account_type],
    queryFn: async () => {
      if (!user) return null;

      if (user.account_type === 'associate') {
        // Associates: Load only assigned data
        const assignments = await base44.entities.CaseAssignment.filter({
          assigned_to_user_id: user.id
        });
        const assignedCaseIds = assignments.map(a => a.case_id);

        if (assignedCaseIds.length === 0) {
          return { cases: [], tasks: [], hearings: [], invoices: [], associates: [] };
        }

        const [allCases, allTasks, allHearings] = await Promise.all([
          safeQuery(() => base44.entities.Case.list('-created_date', 50), []),
          safeQuery(() => base44.entities.Task.list('-created_date', 20), []),
          safeQuery(() => base44.entities.Hearing.list('hearing_date', 20), []),
        ]);

        return {
          cases: allCases.filter(c => assignedCaseIds.includes(c.id)),
          tasks: allTasks.filter(t => t.assigned_to === user.id),
          hearings: allHearings.filter(h => assignedCaseIds.includes(h.case_id)),
          invoices: [],
          associates: []
        };
      } else {
        // Admins/Independent: Load recent data with limits
        const [cases, tasks, hearings, invoices, associates] = await Promise.all([
          safeQuery(() => base44.entities.Case.list('-created_date', 10), []), // Only 10 most recent
          safeQuery(() => base44.entities.Task.filter({ status: 'pending' }, '-created_date', 10), []), // Only pending
          safeQuery(() => base44.entities.Hearing.list('hearing_date', 10), []), // Next 10 hearings
          user.account_type === 'law_firm_admin' || user.account_type === 'independent_advocate'
            ? safeQuery(() => base44.entities.Invoice.filter({
              status: { $in: ['sent', 'overdue'] }
            }, '-created_date', 20), [])
            : Promise.resolve([]),
          user.account_type === 'law_firm_admin'
            ? safeQuery(() => base44.entities.User.filter({
              firm_admin_id: user.id,
              account_type: 'associate'
            }), [])
            : Promise.resolve([])
        ]);

        return { cases, tasks, hearings, invoices, associates };
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const isLoading = isLoadingUser || isLoadingData;

  // Calculate stats from cached data
  const stats = React.useMemo(() => {
    if (!dashboardData) return {
      totalCases: 0, activeCases: 0, upcomingHearings: 0,
      pendingTasks: 0, outstandingInvoices: 0, totalAssociates: 0, activeAssociates: 0
    };

    const { cases, tasks, hearings, invoices, associates } = dashboardData;

    return {
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'active').length,
      upcomingHearings: hearings.filter(h =>
        new Date(h.hearing_date) > new Date() && h.status === 'scheduled'
      ).length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      outstandingInvoices: invoices.filter(inv =>
        inv.status === 'sent' || inv.status === 'overdue'
      ).length,
      totalAssociates: associates.length,
      activeAssociates: associates.filter(a => a.is_active !== false).length
    };
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Failed to load dashboard data. Please try refreshing.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => window.location.reload()}>
              Refresh Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { cases = [], tasks = [], hearings = [], associates = [] } = dashboardData || {};
  const showQuickActions = user?.account_type !== 'associate';
  const showBillingAction = user?.account_type !== 'associate';
  const isLawFirmAdmin = user?.account_type === 'law_firm_admin';

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Counselor'}
            </h1>
            <p className="text-slate-600 mt-1">
              {user?.account_type === 'associate'
                ? "Here are your assigned cases and tasks"
                : user?.account_type === 'law_firm_admin'
                  ? `Managing ${user.firm_name} - Here's your firm's overview`
                  : "Here's what's happening with your legal practice today"
              }
            </p>
            {user?.account_type === 'associate' && user?.firm_name && (
              <p className="text-sm text-slate-500 mt-1">
                Firm: {user.firm_name}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Cases")}>
              <Button className="bg-slate-800 hover:bg-slate-700">
                <Briefcase className="w-4 h-4 mr-2" />
                {user?.account_type === 'associate' ? 'View Cases' : 'Manage Cases'}
              </Button>
            </Link>
          </div>
        </div>

        <QuickStats stats={stats} showAssociateStats={isLawFirmAdmin} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isLawFirmAdmin && <AssociatesList associates={associates} />}
            <RecentCases cases={cases.slice(0, 5)} />
          </div>

          <div className="space-y-6">
            <UpcomingHearings hearings={hearings.filter(h => new Date(h.hearing_date) > new Date()).slice(0, 5)} />
            <PendingTasks tasks={tasks.filter(t => t.status === 'pending').slice(0, 5)} />

            {showQuickActions && (
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5" />
                    Quick Actions
                  </h3>
                  <Link to={createPageUrl("Research")}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Start AI Research
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Calendar")}>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Hearing
                    </Button>
                  </Link>
                  {showBillingAction && (
                    <Link to={createPageUrl("Billing")}>
                      <Button variant="outline" className="w-full justify-start">
                        <Receipt className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                    </Link>
                  )}
                  {isLawFirmAdmin && (
                    <Link to={createPageUrl("TeamManagement")}>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Team
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
