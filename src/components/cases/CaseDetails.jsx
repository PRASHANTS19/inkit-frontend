import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  X,
  Edit,
  Calendar,
  FileText,
  CheckSquare,
  Receipt,
  User,
  MapPin,
  IndianRupee,
  Phone,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react";
import TaskList from "../calendar/TaskList";
import HearingList from "../calendar/HearingList";
import DocumentList from "../documents/DocumentList";
import InvoiceList from "../billing/InvoiceList";
import EventForm from "../calendar/EventForm";
import DocumentUploadForm from "../documents/DocumentUploadForm";
import InvoiceForm from "../billing/InvoiceForm";

const parseDateSafe = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateSafe = (value, pattern, fallback = "N/A") => {
  const date = parseDateSafe(value);
  return date ? format(date, pattern) : fallback;
};

export default function CaseDetails({ case_item, onClose, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [formToShow, setFormToShow] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['case-tasks', case_item.id],
    queryFn: () => base44.entities.Task.filter({ case_id: case_item.id }, '-created_date', 50),
    enabled: activeTab === 'tasks' || activeTab === 'overview',
    staleTime: 30 * 1000,
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['case-documents', case_item.id],
    queryFn: () => base44.entities.Document.filter({ case_id: case_item.id }, '-created_date', 50),
    enabled: activeTab === 'documents' || activeTab === 'overview',
    staleTime: 30 * 1000,
  });

  const { data: hearings = [], isLoading: loadingHearings } = useQuery({
    queryKey: ['case-hearings', case_item.id],
    queryFn: () => base44.entities.Hearing.filter({ case_id: case_item.id }, 'hearing_date', 50),
    enabled: activeTab === 'hearings' || activeTab === 'overview',
    staleTime: 30 * 1000,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['case-invoices', case_item.id],
    queryFn: () => base44.entities.Invoice.filter({ case_id: case_item.id }, '-created_date', 50),
    enabled: activeTab === 'billing' || activeTab === 'overview',
    staleTime: 30 * 1000,
  });

  const handleFormSave = async () => {
    setFormToShow(null);
    setSelectedEvent(null);

    await queryClient.invalidateQueries({ queryKey: ['case-tasks', case_item.id] });
    await queryClient.invalidateQueries({ queryKey: ['case-documents', case_item.id] });
    await queryClient.invalidateQueries({ queryKey: ['case-hearings', case_item.id] });
    await queryClient.invalidateQueries({ queryKey: ['case-invoices', case_item.id] });
    await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    await queryClient.invalidateQueries({ queryKey: ['hearings'] });
  };

  const refreshTabData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['case-tasks', case_item.id] });
    queryClient.invalidateQueries({ queryKey: ['case-hearings', case_item.id] });
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['allTasks'] });
  }, [case_item.id, queryClient]);

  const getHeader = (title, formType) => (
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>{title}</span>
        <Button variant="outline" size="sm" onClick={() => setFormToShow(formType)}>
          <Plus className="w-4 h-4 mr-2" />
          Add {formType.charAt(0).toUpperCase() + formType.slice(1)}
        </Button>
      </CardTitle>
    </CardHeader>
  );

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-gray-100 text-gray-800",
    ON_HOLD: "bg-red-100 text-red-800",
    APPEAL: "bg-blue-100 text-blue-800"
  };

  const priorityColors = {
    HIGH: "bg-red-100 text-red-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-blue-100 text-blue-800"
  };

  const upcomingHearing = hearings
    .filter((h) => {
      const hearingDate = parseDateSafe(h.hearing_date);
      return hearingDate && hearingDate > new Date() && h.status === 'scheduled';
    })
    .sort((a, b) => parseDateSafe(a.hearing_date) - parseDateSafe(b.hearing_date))[0];

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const outstanding = totalBilled - totalPaid;

  return (
    <Card className="shadow-2xl border-0 max-w-6xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl mb-2">{case_item.case_title}</CardTitle>
            <div className="flex items-center gap-3">
              <Badge className={`${statusColors[case_item.status]} text-xs`}>
                {case_item.status?.replace('_', ' ')}
              </Badge>
              <Badge className={`${priorityColors[case_item.priority]} text-xs`}>
                {case_item.priority} priority
              </Badge>
              <span className="text-slate-300">#{case_item.case_number}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(case_item)} className="text-white hover:bg-white/20">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setFormToShow(null); setSelectedEvent(null); }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="hearings">Hearings ({hearings.length})</TabsTrigger>
            <TabsTrigger value="billing">Billing ({invoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {case_item.case_description && (
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Case Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{case_item.case_description}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-600" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold">{case_item.client_name}</p>
                  </div>
                  {case_item.client_contact && (
                    <div>
                      <p className="text-sm text-slate-600">Contact</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <p className="font-medium">{case_item.client_contact}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    Case Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Court</p>
                      <p className="font-semibold">{case_item.court?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Type</p>
                      <p className="font-semibold">{case_item.case_type}</p>
                    </div>
                  </div>
                  {case_item.case_value && (
                    <div>
                      <p className="text-sm text-slate-600">Case Value</p>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-slate-400" />
                        <p className="font-semibold">{case_item.case_value.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {case_item.opposing_counsel && (
                    <div>
                      <p className="text-sm text-slate-600">Opposing Counsel</p>
                      <p className="font-semibold">{case_item.opposing_counsel}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={upcomingHearing ? "bg-amber-50 border-amber-200" : "bg-slate-50"}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Next Hearing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingHearing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <p className="font-semibold text-slate-900">
                          {formatDateSafe(upcomingHearing.hearing_date, 'MMMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Type:</span> {upcomingHearing.hearing_type?.replace('_', ' ')}
                      </p>
                      {upcomingHearing.court_room && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Court Room:</span> {upcomingHearing.court_room}
                        </p>
                      )}
                      {upcomingHearing.judge_name && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Judge:</span> {upcomingHearing.judge_name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No upcoming hearings scheduled</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    Pending Tasks ({pendingTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingTasks.length > 0 ? (
                    <div className="space-y-2">
                      {pendingTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm font-medium">{task.title}</span>
                          <Badge className={
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                      {pendingTasks.length > 3 && (
                        <p className="text-xs text-slate-500">+{pendingTasks.length - 3} more tasks</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No pending tasks</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Documents ({documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm truncate">{doc.title}</span>
                        </div>
                      ))}
                      {documents.length > 3 && (
                        <p className="text-xs text-slate-500">+{documents.length - 3} more documents</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No documents uploaded</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-600" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Billed</span>
                    <span className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {totalBilled.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Paid</span>
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Outstanding</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {outstanding.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Case Created</p>
                    <p className="text-sm text-slate-600">{formatDateSafe(case_item.created_date, 'MMMM d, yyyy', 'Unknown')}</p>
                  </div>
                </div>

                {case_item.filing_date && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Filing Date</p>
                      <p className="text-sm text-slate-600">{formatDateSafe(case_item.filing_date, 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}

                {(case_item.next_hearing_date || upcomingHearing) && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                    <div>
                      <p className="font-medium">Next Hearing Date</p>
                      <p className="text-sm text-slate-600">
                        {case_item.next_hearing_date
                          ? formatDateSafe(case_item.next_hearing_date, 'MMMM d, yyyy h:mm a')
                          : upcomingHearing
                            ? formatDateSafe(upcomingHearing.hearing_date, 'MMMM d, yyyy h:mm a')
                            : 'Not scheduled'
                        }
                      </p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            {formToShow === 'task' ? (
              <EventForm
                cases={cases}
                event={selectedEvent || { type: 'task', case_id: case_item.id }}
                onSave={handleFormSave}
                onCancel={() => {
                  setFormToShow(null);
                  setSelectedEvent(null);
                }}
              />
            ) : (
              <Card>
                {getHeader('Case Tasks', 'task')}
                <CardContent>
                  {loadingTasks ? (
                    <p className="text-center py-8">Loading tasks...</p>
                  ) : (
                    <TaskList
                      tasks={tasks}
                      onTaskUpdate={refreshTabData}
                      onTaskEdit={(task) => {
                        setSelectedEvent({ ...task, type: 'task', date: task.due_date });
                        setFormToShow('task');
                      }}
                      onTaskDelete={async (task) => {
                        if (window.confirm('Are you sure you want to delete this task?')) {
                          await base44.entities.Task.delete(task.id);
                          refreshTabData();
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents">
            {formToShow === 'document' ? (
              <DocumentUploadForm
                cases={cases}
                onSuccess={handleFormSave}
                onCancel={() => setFormToShow(null)}
              />
            ) : (
              <Card>
                {getHeader('Case Documents', 'document')}
                <CardContent>
                  {loadingDocs ? (
                    <p className="text-center py-8">Loading documents...</p>
                  ) : (
                    <DocumentList documents={documents} isLoading={false} />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hearings">
            {formToShow === 'hearing' ? (
              <EventForm
                cases={cases}
                event={selectedEvent || { type: 'hearing', case_id: case_item.id }}
                onSave={handleFormSave}
                onCancel={() => {
                  setFormToShow(null);
                  setSelectedEvent(null);
                }}
              />
            ) : (
              <Card>
                {getHeader('Case Hearings', 'hearing')}
                <CardContent>
                  {loadingHearings ? (
                    <p className="text-center py-8">Loading hearings...</p>
                  ) : (
                    <HearingList
                      hearings={hearings}
                      onHearingUpdate={refreshTabData}
                      onHearingEdit={(hearing) => {
                        setSelectedEvent({ ...hearing, type: 'hearing', date: hearing.hearing_date });
                        setFormToShow('hearing');
                      }}
                      onHearingDelete={async (hearing) => {
                        if (window.confirm('Are you sure you want to delete this hearing?')) {
                          await base44.entities.Hearing.delete(hearing.id);
                          refreshTabData();
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="billing">
            {formToShow === 'invoice' ? (
              <InvoiceForm
                cases={cases}
                invoice={{ case_id: case_item.id }}
                onSave={handleFormSave}
                onCancel={() => setFormToShow(null)}
              />
            ) : (
              <Card>
                {getHeader('Billing & Invoices', 'invoice')}
                <CardContent>
                  {loadingInvoices ? (
                    <p className="text-center py-8">Loading invoices...</p>
                  ) : (
                    <InvoiceList invoices={invoices} isLoading={false} />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
