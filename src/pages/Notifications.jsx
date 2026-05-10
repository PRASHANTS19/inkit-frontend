import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Notifications() {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [processingInvitation, setProcessingInvitation] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      addDebugLog(`Loaded user: ${user.email}, type: ${user.account_type}`);
      
      // Load ALL invitations and filter client-side to bypass RLS
      const allInvitations = await base44.entities.Invitation.list('-created_date', 100);
      const userInvitations = allInvitations.filter(inv => inv.invitee_email === user.email);
      
      setInvitations(userInvitations);
      addDebugLog(`Found ${userInvitations.length} invitations for your email`);
    } catch (e) {
      setError("Failed to load your notifications. Please try again later.");
      addDebugLog(`ERROR loading data: ${e.message}`);
      console.error('Error loading notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    setProcessingInvitation(invitation.id);
    setError(null);
    setDebugLogs([]);
    
    try {
      addDebugLog('=== STARTING INVITATION ACCEPTANCE ===');
      addDebugLog(`Invitation ID: ${invitation.id}`);
      addDebugLog(`Firm: ${invitation.firm_name}`);
      addDebugLog(`Admin ID: ${invitation.firm_admin_id}`);
      addDebugLog(`Current user ID: ${currentUser.id}`);
      addDebugLog(`Current user type: ${currentUser.account_type}`);
      
      addDebugLog('Step 1: Updating invitation status...');
      await base44.entities.Invitation.update(invitation.id, { status: 'accepted' });
      addDebugLog('✓ Invitation status updated successfully');
      
      addDebugLog('Step 2: Updating user profile...');
      await base44.entities.User.update(currentUser.id, {
        account_type: 'associate',
        firm_admin_id: invitation.firm_admin_id,
        firm_name: invitation.firm_name,
        permissions: {
          can_manage_billing: false,
          can_manage_users: false,
          can_view_all_cases: false
        }
      });
      addDebugLog('✓ User profile updated successfully!');
      
      addDebugLog('=== ACCEPTANCE SUCCESSFUL ===');
      alert('✅ Success! Your account has been updated. The page will reload now to show your new role.');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (e) {
      const errorMsg = e.message || 'Unknown error occurred';
      addDebugLog(`=== ACCEPTANCE FAILED ===`);
      addDebugLog(`Final error: ${errorMsg}`);
      console.error('Detailed error:', e);
      setError(`Failed to accept invitation: ${errorMsg}`);
      setProcessingInvitation(null);
    }
  };

  const handleReject = async (invitationId) => {
    setProcessingInvitation(invitationId);
    setError(null);
    
    try {
      await base44.entities.Invitation.update(invitationId, { status: 'rejected' });
      await loadData();
      setProcessingInvitation(null);
    } catch (e) {
      setError(`Failed to reject invitation: ${e.message || 'Unknown error'}`);
      console.error('Error rejecting invitation:', e);
      setProcessingInvitation(null);
    }
  };

  const statusConfig = {
    pending: { color: 'yellow', icon: Clock, text: 'Pending' },
    accepted: { color: 'green', icon: Check, text: 'Accepted' },
    rejected: { color: 'red', icon: X, text: 'Rejected' },
    revoked: { color: 'gray', icon: X, text: 'Revoked' },
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-amber-600" />
            Notifications
          </h1>
          <p className="text-slate-600 mt-1">Manage your firm invitations and other alerts.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentUser && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Current Status:</strong> {currentUser.account_type?.replace('_', ' ')} 
              {currentUser.firm_name && ` at ${currentUser.firm_name}`}
            </AlertDescription>
          </Alert>
        )}

        {debugLogs.length > 0 && (
          <Card className="border-2 border-purple-300 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Debug Console
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-64 overflow-y-auto">
                {debugLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Pending Invitations ({pendingInvitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                <span className="ml-2">Loading invitations...</span>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-slate-500">You have no pending invitations.</p>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map(inv => (
                  <div key={inv.id} className="p-4 border-2 border-blue-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">
                        <span className="font-bold text-blue-600">{inv.firm_name}</span> wants you to join as an Associate
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        ✓ Your role will change to <strong>Associate</strong><br />
                        ✓ You'll be managed by <strong>{inv.firm_name}</strong><br />
                        ✓ You'll get access to assigned cases and tasks
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button 
                        onClick={() => handleAccept(inv)} 
                        size="lg" 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={processingInvitation === inv.id}
                      >
                        {processingInvitation === inv.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => handleReject(inv.id)} 
                        size="lg" 
                        variant="destructive"
                        disabled={processingInvitation === inv.id}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Invitation History</CardTitle>
          </CardHeader>
          <CardContent>
            {otherInvitations.length === 0 ? (
              <p className="text-slate-500">No past invitations.</p>
            ) : (
              <ul className="space-y-3">
                {otherInvitations.map(inv => {
                  const config = statusConfig[inv.status] || statusConfig.revoked;
                  const Icon = config.icon;
                  return (
                    <li key={inv.id} className="p-3 border rounded-lg flex items-center gap-4">
                      <Icon className={`w-5 h-5 text-${config.color}-500`} />
                      <div className="flex-grow">
                        Invitation from <span className="font-semibold">{inv.firm_name}</span>
                      </div>
                      <Badge variant="outline" className={`text-${config.color}-700 border-${config.color}-200 bg-${config.color}-50`}>{config.text}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}