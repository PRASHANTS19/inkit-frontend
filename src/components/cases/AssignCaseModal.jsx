import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, X, Loader2, CheckCircle2 } from "lucide-react";

export default function AssignCaseModal({ case_item, currentUser, onClose, onAssign }) {
  const [associates, setAssociates] = useState([]);
  const [selectedAssociate, setSelectedAssociate] = useState('');
  const [role, setRole] = useState('associate_counsel');
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState({
    can_edit_case: true,
    can_add_documents: true,
    can_schedule_hearings: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [existingAssignments, setExistingAssignments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [associatesList, assignments] = await Promise.all([
        base44.entities.User.filter({
          firm_admin_id: currentUser.id,
          account_type: 'associate'
        }),
        base44.entities.CaseAssignment.filter({ case_id: case_item.id })
      ]);
      
      setAssociates(associatesList);
      setExistingAssignments(assignments);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load associates');
    }
    setIsLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedAssociate) {
      setError('Please select an associate');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const existingAssignment = existingAssignments.find(
        a => a.assigned_to_user_id === selectedAssociate
      );

      if (existingAssignment) {
        setError('This associate is already assigned to this case');
        setIsSaving(false);
        return;
      }

      await base44.entities.CaseAssignment.create({
        case_id: case_item.id,
        assigned_to_user_id: selectedAssociate,
        assigned_by_user_id: currentUser.id,
        assignment_date: new Date().toISOString(),
        role_in_case: role,
        permissions: permissions,
        notes: notes
      });

      onAssign();
      onClose();
    } catch (err) {
      console.error('Error assigning case:', err);
      setError(err.message || 'Failed to assign case');
    }
    setIsSaving(false);
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      await base44.entities.CaseAssignment.delete(assignmentId);
      loadData();
    } catch (err) {
      console.error('Error removing assignment:', err);
      setError('Failed to remove assignment');
    }
  };

  const assignedAssociateIds = existingAssignments.map(a => a.assigned_to_user_id);
  const availableAssociates = associates.filter(a => !assignedAssociateIds.includes(a.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="shadow-2xl border-0 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Assign Case: {case_item.case_title}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Existing Assignments */}
          {existingAssignments.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Currently Assigned Associates</h3>
              <div className="space-y-2">
                {existingAssignments.map(assignment => {
                  const associate = associates.find(a => a.id === assignment.assigned_to_user_id);
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{associate?.full_name || 'Loading...'}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{assignment.role_in_case?.replace('_', ' ')}</Badge>
                          <span className="text-xs text-slate-500">
                            Assigned: {new Date(assignment.assignment_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Assignment Form */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>
          ) : availableAssociates.length === 0 ? (
            <Alert>
              <AlertDescription>
                {associates.length === 0 
                  ? 'No associates available. Invite team members first.'
                  : 'All associates have been assigned to this case.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="border-t pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Assign New Associate</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Select Associate</Label>
                    <Select value={selectedAssociate} onValueChange={setSelectedAssociate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an associate..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssociates.map(associate => (
                          <SelectItem key={associate.id} value={associate.id}>
                            {associate.full_name} ({associate.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Role in Case</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_counsel">Lead Counsel</SelectItem>
                        <SelectItem value="associate_counsel">Associate Counsel</SelectItem>
                        <SelectItem value="research_assistant">Research Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permissions.can_edit_case}
                          onChange={(e) => setPermissions({...permissions, can_edit_case: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Can edit case details</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permissions.can_add_documents}
                          onChange={(e) => setPermissions({...permissions, can_add_documents: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Can add documents</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permissions.can_schedule_hearings}
                          onChange={(e) => setPermissions({...permissions, can_schedule_hearings: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Can schedule hearings</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Assignment Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions or notes for this assignment..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssign}
                  disabled={isSaving || !selectedAssociate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Assign Case
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}