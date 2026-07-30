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
        cnr_number: '',
        client_name: '',
        client_contact: '',
        client_id: '',
        court: 'High_Court',
        case_type: 'Civil',
        status: 'ACTIVE',
        priority: 'MEDIUM',
        case_description: '',
        opposing_counsel: '',
        case_value: '',
        filing_date: '',
        next_hearing_date: '',
        firm_id: ''
    });

    const [clients, setClients] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadData();
    }, [case_item]);

    const loadData = async () => {
        try {
            const userData = await base44.auth.me();
            setCurrentUser(userData);

            const clientRows = await base44.entities.Client.list('-created_date', 200);
            const normalizedClients = Array.isArray(clientRows)
                ? clientRows.map((c) => ({
                    ...c,
                    full_name: c.full_name ?? c.name ?? '',
                    phone: c.phone ?? c.phoneNumber ?? '',
                    address: c.address ?? c.streetAddress ?? ''
                }))
                : [];
            setClients(normalizedClients);

            if (case_item) {
                setFormData({
                    case_title: case_item.case_title || '',
                    case_number: case_item.case_number || '',
                    cnr_number: case_item.cnr_number || '',
                    client_name: case_item.client_name || '',
                    client_contact: case_item.client_contact || '',
                    client_id: case_item.client_id || '',
                    court: case_item.court || 'High_Court',
                    case_type: case_item.case_type || 'Civil',
                    status: case_item.status || 'ACTIVE',
                    priority: case_item.priority || 'MEDIUM',
                    case_description: case_item.case_description || '',
                    opposing_counsel: case_item.opposing_counsel || '',
                    case_value: case_item.case_value || '',
                    filing_date: case_item.filing_date ? new Date(case_item.filing_date).toISOString().split('T')[0] : '',
                    next_hearing_date: case_item.next_hearing_date ? new Date(case_item.next_hearing_date).toISOString().slice(0, 16) : '',
                    firm_id: case_item.firm_id || ''
                });
            } else {
                if (userData.account_type === 'law_firm_admin') {
                    setFormData(prev => ({ ...prev, firm_id: userData.id }));
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
                client_contact: selectedClient.phone || prev.client_contact,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = { ...formData };
        if (submitData.next_hearing_date) {
            submitData.next_hearing_date = submitData.next_hearing_date.split('T')[0];
        }
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

                    {/* Link to Client Account */}
                    <div className="space-y-2">
                        <Label htmlFor="client_id" className="flex items-center gap-2"><UserSearch /> Link to Client Account</Label>
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

                    {/* Case Title + CNR Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="case_title">Case Title *</Label>
                            <Input
                                id="case_title"
                                value={formData.case_title}
                                onChange={(e) => handleChange('case_title', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnr_number">CNR Number</Label>
                            <Input
                                id="cnr_number"
                                value={formData.cnr_number}
                                onChange={(e) => handleChange('cnr_number', e.target.value.toUpperCase())}
                                placeholder="e.g. SCIN010199922026"
                            />
                            <p className="text-xs text-slate-500">Used to auto-sync case data from eCourt daily.</p>
                        </div>
                    </div>

                    {/* Case Number (auto-filled after eCourt sync) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="case_number">Case Number</Label>
                            <Input
                                id="case_number"
                                value={formData.case_number}
                                onChange={(e) => handleChange('case_number', e.target.value)}
                                placeholder="Auto-filled after eCourt sync"
                            />
                        </div>
                        <div />
                    </div>

                    {/* Client Name + Contact */}
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

                    {/* Court + Case Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="court">Court *</Label>
                            <Select value={formData.court} onValueChange={(value) => handleChange('court', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Supreme_Court">Supreme Court</SelectItem>
                                    <SelectItem value="High_Court">High Court</SelectItem>
                                    <SelectItem value="District_Court">District Court</SelectItem>
                                    <SelectItem value="Session_Court">Sessions Court</SelectItem>
                                    <SelectItem value="Megistrate_Court">Magistrate Court</SelectItem>
                                    <SelectItem value="Tribunal">Tribunal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="case_type">Case Type *</Label>
                            <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Civil">Civil</SelectItem>
                                    <SelectItem value="Criminal">Criminal</SelectItem>
                                    <SelectItem value="Corporate">Corporate</SelectItem>
                                    <SelectItem value="Family">Family</SelectItem>
                                    <SelectItem value="Labour">Labor</SelectItem>
                                    <SelectItem value="Tax">Tax</SelectItem>
                                    <SelectItem value="Constitutional">Constitutional</SelectItem>
                                    <SelectItem value="Writ">Writ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Status + Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                    <SelectItem value="APPEAL">Appeal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="LOW">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="case_description">Case Description</Label>
                        <Textarea id="case_description" value={formData.case_description} onChange={(e) => handleChange('case_description', e.target.value)} rows={4} />
                    </div>

                    {/* Opposing Counsel + Case Value */}
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

                    {/* Filing Date + Next Hearing Date */}
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

                    {/* Actions */}
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
