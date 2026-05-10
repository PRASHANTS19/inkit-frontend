
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Trash2, UserSearch } from "lucide-react";

export default function CaseForm({ case_item, onSave, onCancel, onDelete }) {
    const [formData, setFormData] = useState({
        case_title: '',
        case_number: '',
        client_name: '',
        client_contact: '',
        client_id: '',
        court: 'high_court',
        case_type: 'civil',
        status: 'active',
        priority: 'medium',
        case_description: '',
        opposing_counsel: '',
        case_value: '',
        filing_date: '',
        next_hearing_date: '',
        firm_id: '' // Added firm_id
    });
    
    const [clients, setClients] = useState([]);
    const [currentUser, setCurrentUser] = useState(null); // Added currentUser state

    useEffect(() => {
        loadData();
    }, [case_item]);

    const loadData = async () => {
        try {
            // Load current user
            const userData = await base44.auth.me();
            setCurrentUser(userData);

            // Load clients
            const clientUsers = await base44.entities.User.filter({ account_type: 'client' });
            setClients(clientUsers);

            // Set form data
            if (case_item) {
                setFormData({
                    case_title: case_item.case_title || '',
                    case_number: case_item.case_number || '',
                    client_name: case_item.client_name || '',
                    client_contact: case_item.client_contact || '',
                    client_id: case_item.client_id || '',
                    court: case_item.court || 'high_court',
                    case_type: case_item.case_type || 'civil',
                    status: case_item.status || 'active',
                    priority: case_item.priority || 'medium',
                    case_description: case_item.case_description || '',
                    opposing_counsel: case_item.opposing_counsel || '',
                    case_value: case_item.case_value || '',
                    filing_date: case_item.filing_date ? new Date(case_item.filing_date).toISOString().split('T')[0] : '',
                    next_hearing_date: case_item.next_hearing_date ? new Date(case_item.next_hearing_date).toISOString().slice(0, 16) : '',
                    firm_id: case_item.firm_id || '' // Initialize firm_id from case_item
                });
            } else {
                // For new cases, set firm_id to current user's ID if they're a firm admin
                if (userData.account_type === 'law_firm_admin') {
                    setFormData(prev => ({
                        ...prev,
                        firm_id: userData.id
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleClientChange = (clientId) => {
        const selectedClient = clients.find(c => c.id === clientId);
        if (selectedClient) {
            setFormData(prev => ({
                ...prev,
                client_id: selectedClient.id,
                client_name: selectedClient.full_name,
                client_contact: selectedClient.phone || prev.client_contact, // Use phone if available
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Ensure firm_id is set for law firm admins
        const submitData = { ...formData };
        if (currentUser?.account_type === 'law_firm_admin' && !submitData.firm_id) {
            submitData.firm_id = currentUser.id;
        }
        
        onSave(submitData);
    };

    const handleDeleteClick = () => {
        if (window.confirm("Are you sure you want to delete this case? This action cannot be undone.")) {
            onDelete(case_item.id);
        }
    };

    return (
        <Card className="shadow-2xl border-0 max-w-4xl mx-auto my-8">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <CardTitle className="flex items-center justify-between">
                    <span>{case_item ? 'Edit Case' : 'Create New Case'}</span>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
                        <X className="w-5 h-5" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="client_id" className="flex items-center gap-2"><UserSearch/> Link to Client Account</Label>
                         <Select value={formData.client_id} onValueChange={handleClientChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client user..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.full_name} ({c.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Select a registered client to give them access to the case dashboard.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="case_title">Case Title *</Label>
                            <Input id="case_title" value={formData.case_title} onChange={(e) => handleChange('case_title', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="case_number">Case Number *</Label>
                            <Input id="case_number" value={formData.case_number} onChange={(e) => handleChange('case_number', e.target.value)} required />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="client_name">Client Name *</Label>
                            <Input id="client_name" value={formData.client_name} onChange={(e) => handleChange('client_name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client_contact">Client Contact</Label>
                            <Input id="client_contact" value={formData.client_contact} onChange={(e) => handleChange('client_contact', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="court">Court *</Label>
                            <Select value={formData.court} onValueChange={(value) => handleChange('court', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="supreme_court">Supreme Court</SelectItem>
                                    <SelectItem value="high_court">High Court</SelectItem>
                                    <SelectItem value="district_court">District Court</SelectItem>
                                    <SelectItem value="sessions_court">Sessions Court</SelectItem>
                                    <SelectItem value="magistrate_court">Magistrate Court</SelectItem>
                                    <SelectItem value="tribunal">Tribunal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="case_type">Case Type *</Label>
                            <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="civil">Civil</SelectItem>
                                    <SelectItem value="criminal">Criminal</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                    <SelectItem value="family">Family</SelectItem>
                                    <SelectItem value="labor">Labor</SelectItem>
                                    <SelectItem value="tax">Tax</SelectItem>
                                    <SelectItem value="constitutional">Constitutional</SelectItem>
                                    <SelectItem value="writ">Writ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="appeal">Appeal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                             <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="case_description">Case Description</Label>
                        <Textarea id="case_description" value={formData.case_description} onChange={(e) => handleChange('case_description', e.target.value)} rows={4} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="opposing_counsel">Opposing Counsel</Label>
                            <Input id="opposing_counsel" value={formData.opposing_counsel} onChange={(e) => handleChange('opposing_counsel', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="case_value">Case Value (INR)</Label>
                            <Input type="number" id="case_value" value={formData.case_value} onChange={(e) => handleChange('case_value', e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="filing_date">Filing Date</Label>
                            <Input type="date" id="filing_date" value={formData.filing_date} onChange={(e) => handleChange('filing_date', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="next_hearing_date">Next Hearing Date</Label>
                            <Input type="datetime-local" id="next_hearing_date" value={formData.next_hearing_date} onChange={(e) => handleChange('next_hearing_date', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t">
                        <div>
                            {case_item && (
                                <Button type="button" variant="destructive" onClick={handleDeleteClick}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Case
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                            <Button type="submit">
                                <Save className="w-4 h-4 mr-2" />
                                {case_item ? 'Save Changes' : 'Create Case'}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
