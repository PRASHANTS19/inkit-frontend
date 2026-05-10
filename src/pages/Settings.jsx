import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Building, 
  Shield, 
  Save,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Lock
} from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [firmNameError, setFirmNameError] = useState('');

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    firm_name: '',
    bar_registration: '',
    experience_years: 0,
    specialization: [],
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  const [accountSettings, setAccountSettings] = useState({
    account_type: 'independent_advocate',
    permissions: {
      can_manage_billing: true,
      can_manage_users: false,
      can_view_all_cases: true
    }
  });

  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setProfileData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        firm_name: userData.firm_name || '',
        bar_registration: userData.bar_registration || '',
        experience_years: userData.experience_years || 0,
        specialization: userData.specialization || [],
        address: {
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          pincode: userData.address?.pincode || ''
        }
      });
      setAccountSettings({
        account_type: userData.account_type || 'independent_advocate',
        permissions: userData.permissions || {
          can_manage_billing: true,
          can_manage_users: false,
          can_view_all_cases: true
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    }
    setIsLoading(false);
  };

  const handleProfileChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAccountTypeChange = (accountType) => {
    if (user?.account_type === 'associate') {
      setMessage({ 
        type: 'error', 
        text: 'Associates cannot change their account type. Contact your firm administrator.' 
      });
      return;
    }

    let newPermissions = {};
    
    switch (accountType) {
      case 'independent_advocate':
        newPermissions = {
          can_manage_billing: true,
          can_manage_users: false,
          can_view_all_cases: true
        };
        break;
      case 'law_firm_admin':
        newPermissions = {
          can_manage_billing: true,
          can_manage_users: true,
          can_view_all_cases: true
        };
        break;
      case 'associate':
        newPermissions = {
          can_manage_billing: false,
          can_manage_users: false,
          can_view_all_cases: false
        };
        break;
    }

    setAccountSettings({
      account_type: accountType,
      permissions: newPermissions
    });
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !profileData.specialization.includes(newSpecialization.trim())) {
      setProfileData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec) => {
    setProfileData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec)
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    setFirmNameError('');

    if (accountSettings.account_type === 'law_firm_admin' && !profileData.firm_name.trim()) {
        setFirmNameError('Firm Name is required for Law Firm Admins.');
        setIsSaving(false);
        return;
    }
    
    try {
      const updateData = {
        ...profileData,
        ...accountSettings
      };

      if (user?.account_type === 'associate') {
        updateData.firm_admin_id = user.firm_admin_id;
        updateData.account_type = 'associate';
        updateData.permissions = user.permissions;
      }
      
      if (user?.account_type === 'law_firm_admin' && profileData.firm_name !== user.firm_name) {
          const firmInvitations = await base44.entities.Invitation.filter({ firm_admin_id: user.id });
          for (const inv of firmInvitations) {
              if (inv.status === 'pending' || inv.status === 'accepted') {
                  await base44.entities.Invitation.update(inv.id, { firm_name: profileData.firm_name });
              }
          }
      }

      await base44.auth.updateMe(updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => {
        loadUserData();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
    setIsSaving(false);
  };

  const getAccountTypeBadge = (accountType) => {
    switch(accountType) {
      case 'independent_advocate':
        return { label: 'Independent Advocate', className: 'bg-blue-100 text-blue-800', icon: UserIcon };
      case 'law_firm_admin':
        return { label: 'Law Firm Admin', className: 'bg-purple-100 text-purple-800', icon: Building };
      case 'associate':
        return { label: 'Associate', className: 'bg-green-100 text-green-800', icon: Briefcase };
      default:
        return { label: 'User', className: 'bg-gray-100 text-gray-800', icon: UserIcon };
    }
  };

  const canEditAccountType = user?.account_type !== 'associate';
  const canEditFirmName = user?.account_type !== 'associate';

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-slate-600" />
            Settings
          </h1>
          <p className="text-slate-600 mt-1">Manage your account and preferences</p>
        </div>

        {message.text && (
          <Alert className={`border-l-4 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? 
                <CheckCircle2 className="w-5 h-5 text-green-600" /> : 
                <AlertTriangle className="w-5 h-5 text-red-600" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {user?.account_type === 'associate' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You are an associate managed by <strong>{user.firm_name}</strong>. 
              Some settings can only be changed by your firm administrator.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account Type</TabsTrigger>
            <TabsTrigger value="firm">Firm Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => handleProfileChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bar_registration">Bar Registration Number</Label>
                    <Input
                      id="bar_registration"
                      value={profileData.bar_registration}
                      onChange={(e) => handleProfileChange('bar_registration', e.target.value)}
                      placeholder="Enter bar registration number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={profileData.experience_years}
                    onChange={(e) => handleProfileChange('experience_years', parseInt(e.target.value) || 0)}
                    placeholder="Years of legal practice"
                  />
                </div>

                <div>
                  <Label>Areas of Specialization</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      placeholder="Add specialization..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                    />
                    <Button type="button" variant="outline" onClick={addSpecialization}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.specialization.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {spec}
                        <button onClick={() => removeSpecialization(spec)} className="ml-1 text-xs hover:text-red-600">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={profileData.address.street}
                        onChange={(e) => handleProfileChange('address.street', e.target.value)}
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.address.city}
                        onChange={(e) => handleProfileChange('address.city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileData.address.state}
                        onChange={(e) => handleProfileChange('address.state', e.target.value)}
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">PIN Code</Label>
                      <Input
                        id="pincode"
                        value={profileData.address.pincode}
                        onChange={(e) => handleProfileChange('address.pincode', e.target.value)}
                        placeholder="Enter PIN code"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Type & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="account_type">Account Type</Label>
                  {canEditAccountType ? (
                    <Select value={accountSettings.account_type} onValueChange={handleAccountTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="independent_advocate">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Independent Advocate
                          </div>
                        </SelectItem>
                        <SelectItem value="law_firm_admin">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Law Firm Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="relative">
                      <Input 
                        value={getAccountTypeBadge(accountSettings.account_type).label}
                        disabled 
                        className="bg-gray-50"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  {!canEditAccountType && (
                    <p className="text-xs text-gray-500 mt-1">
                      Account type managed by your firm administrator
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const badge = getAccountTypeBadge(accountSettings.account_type);
                      return (
                        <>
                          <badge.icon className="w-6 h-6 text-slate-600" />
                          <div>
                            <h3 className="font-semibold">{badge.label}</h3>
                            <Badge className={badge.className}>{badge.label}</Badge>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Permissions:</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <span className={accountSettings.permissions.can_manage_billing ? 'text-green-600' : 'text-red-600'}>
                          {accountSettings.permissions.can_manage_billing ? '✓' : '✗'}
                        </span>
                        Manage Billing & Invoicing
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={accountSettings.permissions.can_manage_users ? 'text-green-600' : 'text-red-600'}>
                          {accountSettings.permissions.can_manage_users ? '✓' : '✗'}
                        </span>
                        Manage Users & Team
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={accountSettings.permissions.can_view_all_cases ? 'text-green-600' : 'text-red-600'}>
                          {accountSettings.permissions.can_view_all_cases ? '✓' : '✗'}
                        </span>
                        View All Cases
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firm">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Firm Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="firm_name">Law Firm Name</Label>
                  {canEditFirmName ? (
                    <Input
                      id="firm_name"
                      value={profileData.firm_name}
                      onChange={(e) => handleProfileChange('firm_name', e.target.value)}
                      placeholder="Enter your law firm name"
                      className={firmNameError ? 'border-red-500' : ''}
                    />
                  ) : (
                    <div className="relative">
                      <Input
                        id="firm_name"
                        value={profileData.firm_name}
                        disabled
                        className="bg-gray-50"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  {firmNameError && <p className="text-xs text-red-600 mt-1">{firmNameError}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    {canEditFirmName 
                      ? "This name will appear on invoices and invitations sent to associates"
                      : "Firm name is managed by your administrator"
                    }
                  </p>
                </div>

                {accountSettings.account_type === 'law_firm_admin' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Firm Admin Features</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Create and manage associate accounts</li>
                      <li>• Assign cases and tasks to team members</li>
                      <li>• Access team management dashboard</li>
                      <li>• Handle firm-wide billing and invoicing</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-slate-800 hover:bg-slate-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}