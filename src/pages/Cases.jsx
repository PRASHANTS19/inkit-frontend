import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, UserCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import CaseForm from "../components/cases/CaseForm";
import CaseList from "../components/cases/CaseList";
import CaseDetails from "../components/cases/CaseDetails";
import AssignCaseModal from "../components/cases/AssignCaseModal";

export default function Cases() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [caseToAssign, setCaseToAssign] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const location = useLocation();
  const queryClient = useQueryClient();

  const addDebug = (msg) => {
    console.log('[CASES DEBUG]', msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // Load user with caching
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      addDebug('Loading current user...');
      const userData = await base44.auth.me();
      addDebug(`User loaded: ${userData.email}, type: ${userData.account_type}, id: ${userData.id}`);
      return userData;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Load cases with caching
  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['cases', user?.id, user?.account_type],
    queryFn: async () => {
      if (!user) {
        addDebug('No user loaded, skipping cases fetch');
        return [];
      }

      if (user.account_type === 'associate') {
        addDebug(`Loading cases for ASSOCIATE: ${user.id}`);

        // Step 1: Get assignments
        const allAssignments = await base44.entities.CaseAssignment.list('-assignment_date', 200);
        addDebug(`Total assignments in DB: ${allAssignments.length}`);

        const myAssignments = allAssignments.filter(a => a.assigned_to_user_id === user.id);
        addDebug(`Assignments for this associate: ${myAssignments.length}`);

        myAssignments.forEach((a, idx) => {
          addDebug(`Assignment ${idx + 1}: case_id=${a.case_id}`);
        });

        if (myAssignments.length === 0) {
          addDebug('No assignments found for this associate');
          return [];
        }

        const assignedCaseIds = myAssignments.map(a => a.case_id);
        addDebug(`Looking for case IDs: ${assignedCaseIds.join(', ')}`);

        // Step 2: Get ALL cases
        const allCases = await base44.entities.Case.list('-created_date', 200);
        addDebug(`Total cases in DB: ${allCases.length}`);

        // Step 3: Filter for assigned cases
        const assignedCases = allCases.filter(c => assignedCaseIds.includes(c.id));
        addDebug(`Assigned cases found: ${assignedCases.length}`);

        assignedCases.forEach((c, idx) => {
          addDebug(`Case ${idx + 1}: ${c.case_title} (ID: ${c.id}, firm_id: ${c.firm_id})`);
        });

        return assignedCases;
      }

      // For admins and independent advocates
      addDebug(`Loading all cases for ${user.account_type}`);
      const allCases = await base44.entities.Case.list('-created_date', 200);
      addDebug(`Loaded ${allCases.length} cases`);
      return allCases;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Filter cases on client side
  const filteredCases = React.useMemo(() => {
    let filtered = cases;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.case_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (courtFilter !== "all") {
      filtered = filtered.filter(c => c.court === courtFilter);
    }

    return filtered;
  }, [cases, searchTerm, statusFilter, courtFilter]);

  // Handle URL param for viewing case
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const caseIdToView = urlParams.get('view');
    if (caseIdToView && cases.length > 0) {
      const caseToView = cases.find(c => c.id === caseIdToView);
      if (caseToView) {
        setSelectedCase(caseToView);
      }
    }
  }, [cases, location.search]);

  const handleSaveCase = async (caseData) => {
    try {
      addDebug(`Saving case with firm_id: ${caseData.firm_id}`);
      if (editingCase) {
        await base44.entities.Case.update(editingCase.id, caseData);
        addDebug('Case updated successfully');
      } else {
        const newCase = await base44.entities.Case.create(caseData);
        addDebug(`Case created with ID: ${newCase.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
    } catch (error) {
      console.error('Error saving case:', error);
      addDebug(`ERROR saving case: ${error.message}`);
    }
  };

  const handleDeleteCase = async (caseId) => {
    try {
      await base44.entities.Case.delete(caseId);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
      setSelectedCase(null);
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  };

  const handleEditCase = (case_item) => {
    setEditingCase(case_item);
    setShowForm(true);
    setSelectedCase(null);
  };

  const handleViewCase = (case_item) => {
    setSelectedCase(case_item);
    setShowForm(false);
  };

  const handleAssignCase = (case_item) => {
    addDebug(`Opening assignment modal for case: ${case_item.id}`);
    setCaseToAssign(case_item);
    setShowAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    addDebug('Assignment completed, refreshing data...');
    queryClient.invalidateQueries({ queryKey: ['caseAssignments'] });
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    setShowAssignModal(false);
    setCaseToAssign(null);
  };

  const canCreateCase = user?.account_type !== 'associate';
  const canAssignCases = user?.account_type === 'law_firm_admin';

  if (loadingUser) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Debug Console */}
        {debugInfo.length > 0 && (
          <Card className="border-2 border-purple-300 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Debug Console (Cases Page)
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {user?.account_type === 'associate' ? 'Assigned Cases' : 'Case Management'}
            </h1>
            <p className="text-slate-600 mt-1">
              {user?.account_type === 'associate'
                ? 'Cases assigned to you by your firm administrator'
                : 'Manage and track all your legal cases'
              }
            </p>
          </div>
          {canCreateCase && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingCase(null);
                setSelectedCase(null);
              }}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          )}
        </div>

        {showForm && (
          <CaseForm
            case_item={editingCase}
            onSave={handleSaveCase}
            onCancel={() => {
              setShowForm(false);
              setEditingCase(null);
            }}
            onDelete={handleDeleteCase}
          />
        )}

        {selectedCase && (
          <CaseDetails
            case_item={selectedCase}
            onClose={() => setSelectedCase(null)}
            onEdit={handleEditCase}
            onDelete={handleDeleteCase}
          />
        )}

        {showAssignModal && caseToAssign && (
          <AssignCaseModal
            case_item={caseToAssign}
            currentUser={user}
            onClose={() => {
              setShowAssignModal(false);
              setCaseToAssign(null);
            }}
            onAssign={handleAssignmentComplete}
          />
        )}

        {!showForm && !selectedCase && (
          <>
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search cases by title, number, or client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={courtFilter} onValueChange={setCourtFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Court" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courts</SelectItem>
                      <SelectItem value="supreme_court">Supreme Court</SelectItem>
                      <SelectItem value="high_court">High Court</SelectItem>
                      <SelectItem value="district_court">District Court</SelectItem>
                      <SelectItem value="sessions_court">Sessions Court</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <CaseList
              cases={filteredCases}
              isLoading={loadingCases}
              onEdit={handleEditCase}
              onView={handleViewCase}
              onAssign={canAssignCases ? handleAssignCase : null}
              userRole={user?.account_type}
            />
          </>
        )}
      </div>
    </div>
  );
}