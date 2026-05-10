import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  AlertTriangle,
  Send,
  UserCheck,
  UserX,
  X,
  Loader2,
  CheckCircle2
} from "lucide-react";

const InviteAssociateModal = ({ firmName, currentUserId, onInvite, onCancel, isInviting }) => {
  const [email, setEmail] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${time}] ${msg}`]);
    console.log(`[INVITE DEBUG] ${msg}`);
  };

  const handleInvite = async () => {
    setDebugLogs([]);
    addLog('=== STARTING INVITATION PROCESS ===');
    addLog(`Firm: ${firmName}`);
    addLog(`Admin ID: ${currentUserId}`);
    addLog(`Invitee Email: ${email}`);
    await onInvite(email, addLog);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="shadow-2xl border-0 max-w-2xl w-full">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle>Invite New Associate</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Enter the email address of the person you want to invite to join <span className="font-bold">{firmName}</span>. They will receive a notification to accept or reject the invitation.
          </p>
          <div>
            <Label htmlFor="invite-email">Associate's Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., advocate@example.com"
            />
          </div>

          {debugLogs.length > 0 && (
            <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold mb-2">Debug Log:</h4>
              <div className="bg-black text-green-400 p-2 rounded font-mono text-xs max-h-48 overflow-y-auto">
                {debugLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={isInviting}>Cancel</Button>
            <Button onClick={handleInvite} disabled={isInviting || !email} className="bg-blue-600 hover:bg-blue-700">
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function TeamManagement() {
  const [associates, setAssociates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userData = await base44.auth.me();
      console.log('Current user loaded:', userData);
      setCurrentUser(userData);

      if (userData.account_type !== 'law_firm_admin') {
        setError('Only firm administrators can access team management.');
        setIsLoading(false);
        return;
      }

      // Load all invitations and associates without filters to bypass RLS issues
      const [associateData, allInvitations] = await Promise.all([
        base44.entities.User.filter({
          firm_admin_id: userData.id,
          account_type: 'associate'
        }).catch(err => {
          console.error('Error loading associates:', err);
          return [];
        }),
        base44.entities.Invitation.list('-created_date', 100).catch(err => {
          console.error('Error loading invitations:', err);
          return [];
        })
      ]);

      // Filter invitations client-side
      const myInvitations = allInvitations.filter(inv => 
        inv.firm_admin_id === userData.id || inv.created_by === userData.email
      );

      console.log('Loaded associates:', associateData);
      console.log('All invitations:', allInvitations);
      console.log('My invitations:', myInvitations);

      setAssociates(associateData);
      setInvitations(myInvitations);
    } catch (error) {
      console.error('Critical error loading team data:', error);
      setError('Failed to load team management data. Please refresh the page.');
    }

    setIsLoading(false);
  };

  const handleInviteAssociate = async (email, addLog) => {
    setError(null);
    setSuccess(null);
    setIsInviting(true);

    try {
      addLog('Step 1: Validating email format...');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        addLog('✗ Invalid email format');
        setError('Please enter a valid email address.');
        setIsInviting(false);
        return;
      }
      addLog('✓ Email format valid');

      addLog('Step 2: Checking if user already exists...');
      const existingUsers = await base44.entities.User.list();
      const userWithEmail = existingUsers.find(u => u.email === email);
      addLog(`Found ${userWithEmail ? 1 : 0} existing user(s) with this email`);
      
      if (userWithEmail) {
        addLog(`User found: ${userWithEmail.email}, type: ${userWithEmail.account_type}, firm_admin_id: ${userWithEmail.firm_admin_id || 'none'}`);
        
        if (userWithEmail.account_type === 'associate' && userWithEmail.firm_admin_id) {
          addLog('✗ User is already an associate of another firm');
          setError('This user is already an associate of a firm.');
          setIsInviting(false);
          return;
        }
        if (userWithEmail.account_type === 'law_firm_admin') {
          addLog('✗ User is already a firm administrator');
          setError('This user is already a firm administrator.');
          setIsInviting(false);
          return;
        }
      }
      addLog('✓ User check passed');

      addLog('Step 3: Checking for existing invitations...');
      const allInvitations = await base44.entities.Invitation.list();
      const existingInvites = allInvitations.filter(inv =>
        inv.firm_admin_id === currentUser.id &&
        inv.invitee_email === email &&
        (inv.status === 'pending' || inv.status === 'accepted')
      );
      addLog(`Found ${existingInvites.length} existing invitation(s)`);
      
      if (existingInvites.length > 0) {
        addLog('✗ Invitation already exists');
        setError('An invitation has already been sent to this email address and is pending or has been accepted.');
        setIsInviting(false);
        return;
      }
      addLog('✓ No duplicate invitations');

      addLog('Step 4: Creating invitation in database...');
      const invitationData = {
        firm_admin_id: currentUser.id,
        firm_name: currentUser.firm_name,
        invitee_email: email,
        status: 'pending',
        created_by_user_id: currentUser.id
      };
      addLog(`Invitation data: ${JSON.stringify(invitationData)}`);
      
      const createdInvitation = await base44.entities.Invitation.create(invitationData);
      addLog(`✓ Invitation created successfully! ID: ${createdInvitation.id}`);
      
      addLog('Step 5: Waiting 1 second for database sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Step 6: Verifying invitation was saved...');
      const allInvitationsAfter = await base44.entities.Invitation.list();
      const foundInvitation = allInvitationsAfter.find(inv => inv.id === createdInvitation.id);
      addLog(`Verification: ${foundInvitation ? '✓ Found' : '✗ NOT found'} invitation with ID ${createdInvitation.id}`);
      
      if (foundInvitation) {
        addLog(`Invitation details: ${JSON.stringify(foundInvitation)}`);
      } else {
        addLog('⚠️ Warning: Invitation created but not appearing in list query');
        addLog('This might be an RLS issue, but the invitation should still work');
      }
      
      addLog('=== INVITATION SENT SUCCESSFULLY ===');
      setSuccess(`✅ Invitation sent successfully to ${email}!`);
      setShowInviteModal(false);
      
      addLog('Reloading team data...');
      await loadData();
      
    } catch (err) {
      console.error('Error inviting associate:', err);
      addLog(`✗ ERROR: ${err.message}`);
      setError(err.message || "An unexpected error occurred while sending the invitation.");
    }
    setIsInviting(false);
  };

  const handleRemoveAssociate = async (associate) => {
    setError(null);
    setSuccess(null);

    if (!window.confirm(`Are you sure you want to remove ${associate.full_name} from your firm?`)) {
        return;
    }
    try {
        await base44.entities.User.update(associate.id, {
            account_type: 'independent_advocate',
            firm_admin_id: null,
            firm_name: null,
        });

        const invite = invitations.find(
          inv => inv.invitee_email === associate.email &&
                 inv.firm_admin_id === currentUser.id &&
                 inv.status === 'accepted'
        );
        if (invite) {
            await base44.entities.Invitation.update(invite.id, { status: 'revoked' });
        }

        const associateAssignments = await base44.entities.CaseAssignment.filter({ assigned_to_user_id: associate.id });
        if (associateAssignments.length > 0) {
            await Promise.all(associateAssignments.map(a => base44.entities.CaseAssignment.delete(a.id)));
        }

        setSuccess(`${associate.full_name} has been removed from the firm.`);
        loadData();
    } catch (err) {
        console.error('Error removing associate:', err);
        setError("Failed to remove associate. Please try again.");
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    setError(null);
    setSuccess(null);
    try {
        await base44.entities.Invitation.update(invitationId, { status: 'revoked' });
        setSuccess("Invitation has been revoked.");
        loadData();
    } catch (err) {
        console.error("Error revoking invitation:", err);
        setError("Failed to revoke invitation.");
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (!currentUser && !isLoading) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">{error || 'Only firm administrators can access team management.'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Team Management
            </h1>
            <p className="text-slate-600 mt-1">
              Invite and manage associates for {currentUser?.firm_name || 'your firm'}
            </p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Invite Associate
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50">
             <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {showInviteModal && (
          <InviteAssociateModal
            firmName={currentUser?.firm_name || 'your firm'}
            currentUserId={currentUser?.id}
            onInvite={handleInviteAssociate}
            onCancel={() => {
              setShowInviteModal(false);
              setError(null);
              setSuccess(null);
            }}
            isInviting={isInviting}
          />
        )}

        <Tabs defaultValue="associates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="associates">
              <UserCheck className="w-4 h-4 mr-2" />
              Associates ({associates.length})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Send className="w-4 h-4 mr-2" />
              Pending ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="associates" className="space-y-4">
            {associates.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No current associates</h3>
                  <p className="text-slate-500 mb-6">Invite users to join your legal team.</p>
                  <Button onClick={() => setShowInviteModal(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    Invite Associate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {associates.map(associate => (
                  <Card key={associate.id} className="shadow-lg border-0">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{associate.full_name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4" />
                              <span>{associate.email}</span>
                            </div>
                            {associate.phone && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-4 h-4" />
                                <span>{associate.phone}</span>
                              </div>
                            )}
                            {associate.bar_registration && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Shield className="w-4 h-4" />
                                <span>Bar: {associate.bar_registration}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>{associate.experience_years || 0} years experience</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAssociate(associate)}
                        >
                          <UserX className="w-4 h-4 mr-2" /> Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {pendingInvitations.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Send className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending invitations</h3>
                  <p className="text-slate-500 mb-6">Use the "Invite Associate" button to send an invitation.</p>
                  <Button onClick={() => setShowInviteModal(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    Invite Associate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map(invitation => (
                  <Card key={invitation.id} className="shadow-lg border-0">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{invitation.invitee_email}</p>
                          <p className="text-sm text-slate-500">
                            Status: <Badge variant="outline">{invitation.status}</Badge> |
                            Sent: {new Date(invitation.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          <X className="w-4 h-4 mr-2" /> Revoke
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}