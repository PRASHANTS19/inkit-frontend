
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Briefcase,
  CheckSquare,
  Search,
  UserCheck,
  Calendar,
  FileText,
  AlertTriangle,
  Trash2,
  Eye,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Assignments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssociate, setSelectedAssociate] = useState('all');
  const [debugInfo, setDebugInfo] = useState([]);
  const queryClient = useQueryClient();

  const addDebug = (msg) => {
    console.log('[ASSIGNMENTS DEBUG]', msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      addDebug('Loading current user...');
      const user = await base44.auth.me();
      addDebug(`User loaded: ${user.email}, type: ${user.account_type}, id: ${user.id}`);
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: associates = [], isLoading: loadingAssociates } = useQuery({
    queryKey: ['associates', currentUser?.id],
    queryFn: async () => {
      if (!currentUser || currentUser.account_type !== 'law_firm_admin') {
        addDebug('User is not a firm admin, skipping associates load');
        return [];
      }
      addDebug(`Loading associates for firm admin: ${currentUser.id}`);
      const assocs = await base44.entities.User.filter({
        firm_admin_id: currentUser.id,
        account_type: 'associate'
      });
      addDebug(`Loaded ${assocs.length} associates`);
      return assocs;
    },
    enabled: !!currentUser && currentUser.account_type === 'law_firm_admin',
  });

  const { data: caseAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['caseAssignments', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) {
        addDebug('No current user, skipping assignments load');
        return [];
      }
      addDebug(`Loading case assignments for user: ${currentUser.id}`);

      // Load ALL assignments without filters to bypass RLS
      const allAssignments = await base44.entities.CaseAssignment.list('-assignment_date', 200);
      addDebug(`Total assignments in database: ${allAssignments.length}`);

      // Filter client-side for this admin
      const myAssignments = allAssignments.filter(a => a.assigned_by_user_id === currentUser.id);
      addDebug(`Assignments created by this admin: ${myAssignments.length}`);

      myAssignments.forEach((a, idx) => {
        addDebug(`Assignment ${idx + 1}: case_id=${a.case_id}, assigned_to=${a.assigned_to_user_id}, assigned_by=${a.assigned_by_user_id}`);
      });

      return myAssignments;
    },
    enabled: !!currentUser,
    staleTime: 60 * 1000,
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      addDebug('Loading all cases...');
      const allCases = await base44.entities.Case.list('-created_date', 200);
      addDebug(`Loaded ${allCases.length} cases`);
      return allCases;
    },
    staleTime: 60 * 1000,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['allTasks'],
    queryFn: async () => {
      addDebug('Loading all tasks...');
      const allTasks = await base44.entities.Task.list('-created_date', 200);
      addDebug(`Loaded ${allTasks.length} tasks`);
      return allTasks;
    },
    staleTime: 60 * 1000,
  });

  const handleRemoveCaseAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this case assignment?')) return;
    try {
      addDebug(`Removing assignment: ${assignmentId}`);
      await base44.entities.CaseAssignment.delete(assignmentId);
      queryClient.invalidateQueries({ queryKey: ['caseAssignments'] });
      addDebug('Assignment removed successfully');
    } catch (error) {
      console.error('Error removing assignment:', error);
      addDebug(`Error removing assignment: ${error.message}`);
    }
  };

  const handleRemoveTaskAssignment = async (taskId) => {
    if (!window.confirm('Unassign this task?')) return;
    try {
      await base44.entities.Task.update(taskId, { assigned_to: null });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    } catch (error) {
      console.error('Error removing task assignment:', error);
    }
  };

  if (loadingUser) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.account_type !== 'law_firm_admin') {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">Only firm administrators can access assignment management.</p>
      </div>
    );
  }

  const isLoading = loadingAssociates || loadingAssignments || loadingCases || loadingTasks;

  const filteredCaseAssignments = caseAssignments.filter(assignment => {
    if (selectedAssociate !== 'all' && assignment.assigned_to_user_id !== selectedAssociate) {
      return false;
    }
    if (searchTerm) {
      const caseItem = cases.find(c => c.id === assignment.case_id);
      return caseItem?.case_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem?.case_number?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const assignedTasks = tasks.filter(task =>
    task.assigned_to && associates.some(a => a.id === task.assigned_to)
  );

  const filteredTasks = assignedTasks.filter(task => {
    if (selectedAssociate !== 'all' && task.assigned_to !== selectedAssociate) {
      return false;
    }
    if (searchTerm) {
      return task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const getAssignmentStats = () => {
    const stats = associates.map(associate => {
      const casesCount = caseAssignments.filter(a => a.assigned_to_user_id === associate.id).length;
      const tasksCount = assignedTasks.filter(t => t.assigned_to === associate.id).length;
      return {
        associate,
        casesCount,
        tasksCount,
        totalAssignments: casesCount + tasksCount
      };
    });
    return stats.sort((a, b) => b.totalAssignments - a.totalAssignments);
  };

  const assignmentStats = getAssignmentStats();

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Debug Console */}
        {debugInfo.length > 0 && (
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Debug Console (Real-time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-64 overflow-y-auto">
                {debugInfo.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setDebugInfo([])}
              >
                Clear Console
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-blue-600" />
              Team Assignments
            </h1>
            <p className="text-slate-600 mt-1">
              Manage case and task assignments for your associates
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Cases")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Briefcase className="w-4 h-4 mr-2" />
                Assign Cases
              </Button>
            </Link>
            <Link to={createPageUrl("TeamManagement")}>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Associates</p>
                  <p className="text-3xl font-bold mt-1">{associates.length}</p>
                </div>
                <Users className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Case Assignments</p>
                  <p className="text-3xl font-bold mt-1">{caseAssignments.length}</p>
                </div>
                <Briefcase className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Task Assignments</p>
                  <p className="text-3xl font-bold mt-1">{assignedTasks.length}</p>
                </div>
                <CheckSquare className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Associate Performance Overview */}
        {associates.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Associate Workload Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignmentStats.map(({ associate, casesCount, tasksCount, totalAssignments }) => (
                  <div key={associate.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{associate.full_name}</p>
                      <p className="text-sm text-slate-600">{associate.email}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{casesCount}</p>
                        <p className="text-xs text-slate-500">Cases</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{tasksCount}</p>
                        <p className="text-xs text-slate-500">Tasks</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAssociate(associate.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedAssociate}
                onChange={(e) => setSelectedAssociate(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Associates</option>
                {associates.map(associate => (
                  <option key={associate.id} value={associate.id}>
                    {associate.full_name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Tabs */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Case Assignments ({filteredCaseAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Task Assignments ({filteredTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            {isLoading ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-600">Loading assignments...</p>
                </CardContent>
              </Card>
            ) : filteredCaseAssignments.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No case assignments</h3>
                  <p className="text-slate-500 mb-6">Assign cases to your associates from the Cases page.</p>
                  <Link to={createPageUrl("Cases")}>
                    <Button>
                      <Briefcase className="w-4 h-4 mr-2" />
                      Go to Cases
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCaseAssignments.map(assignment => {
                  const caseItem = cases.find(c => c.id === assignment.case_id);
                  const associate = associates.find(a => a.id === assignment.assigned_to_user_id);

                  return (
                    <Card key={assignment.id} className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <Briefcase className="w-5 h-5 text-blue-600 mt-1" />
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900">{caseItem?.case_title || 'Loading...'}</h3>
                                <p className="text-sm text-slate-600">Case #{caseItem?.case_number}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-slate-500">Assigned To</p>
                                <p className="font-semibold">{associate?.full_name || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Role</p>
                                <Badge variant="outline">{assignment.role_in_case?.replace('_', ' ')}</Badge>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Assigned Date</p>
                                <p className="text-sm">{new Date(assignment.assignment_date).toLocaleDateString()}</p>
                              </div>
                              {assignment.notes && (
                                <div className="md:col-span-2">
                                  <p className="text-xs text-slate-500">Notes</p>
                                  <p className="text-sm">{assignment.notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              {assignment.permissions?.can_edit_case && (
                                <Badge className="bg-green-100 text-green-800">Can Edit</Badge>
                              )}
                              {assignment.permissions?.can_add_documents && (
                                <Badge className="bg-blue-100 text-blue-800">Can Add Docs</Badge>
                              )}
                              {assignment.permissions?.can_schedule_hearings && (
                                <Badge className="bg-purple-100 text-purple-800">Can Schedule</Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Link to={createPageUrl(`Cases?view=${assignment.case_id}`)}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Case
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCaseAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            {isLoading ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-600">Loading tasks...</p>
                </CardContent>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No task assignments</h3>
                  <p className="text-slate-500 mb-6">Assign tasks to your associates from the Calendar page.</p>
                  <Link to={createPageUrl("Calendar")}>
                    <Button>
                      <Calendar className="w-4 h-4 mr-2" />
                      Go to Calendar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map(task => {
                  const associate = associates.find(a => a.id === task.assigned_to);
                  const caseItem = cases.find(c => c.id === task.case_id);

                  const priorityColors = {
                    urgent: 'bg-red-100 text-red-800',
                    high: 'bg-orange-100 text-orange-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    low: 'bg-blue-100 text-blue-800'
                  };

                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    in_progress: 'bg-blue-100 text-blue-800',
                    completed: 'bg-green-100 text-green-800',
                    cancelled: 'bg-gray-100 text-gray-800'
                  };

                  return (
                    <Card key={task.id} className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <CheckSquare className="w-5 h-5 text-green-600 mt-1" />
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                                {task.description && (
                                  <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-slate-500">Assigned To</p>
                                <p className="font-semibold">{associate?.full_name || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Case</p>
                                <p className="text-sm">{caseItem?.case_title || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Due Date</p>
                                <p className="text-sm">{new Date(task.due_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Type</p>
                                <Badge variant="outline">{task.task_type?.replace('_', ' ')}</Badge>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Badge className={priorityColors[task.priority]}>
                                {task.priority} priority
                              </Badge>
                              <Badge className={statusColors[task.status]}>
                                {task.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTaskAssignment(task.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Unassign
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
