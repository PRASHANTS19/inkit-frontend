import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Trash2, Briefcase, Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EventForm({ event, cases, onSave, onCancel, onDelete }) {
  const [eventType, setEventType] = useState(event?.type || 'task');
  const [user, setUser] = useState(null);
  const [associates, setAssociates] = useState([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingAssociates, setIsLoadingAssociates] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    case_id: event?.case_id || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    firm_id: event?.firm_id || '',
    priority: event?.priority || 'medium',
    task_type: event?.task_type || 'other',
    estimated_hours: event?.estimated_hours || '',
    assigned_to: event?.assigned_to || '',
    hearing_type: event?.hearing_type || 'preliminary',
    court_room: event?.court_room || '',
    judge_name: event?.judge_name || ''
  });

  // 🔧 FIX #2: Improved associates loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingUser(true);
      setError(null);
      
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Set firm_id for law firm admins
        if (userData.account_type === 'law_firm_admin' && !formData.firm_id) {
          setFormData(prev => ({ ...prev, firm_id: userData.id }));
        }
        
        // Pre-assign task to current user if associate
        if (!event && userData.account_type === 'associate') {
          setFormData(prev => ({ ...prev, assigned_to: userData.id }));
        } else if (!event && userData.account_type !== 'law_firm_admin') {
          setFormData(prev => ({ ...prev, assigned_to: userData.id }));
        }

        // 🔧 FIX #2: Load ALL associates under the firm
        if (userData.account_type === 'law_firm_admin') {
          setIsLoadingAssociates(true);
          try {
            // Fetch all users and filter client-side to bypass RLS issues
            const allUsers = await base44.entities.User.list();
            const firmAssociates = allUsers.filter(u => 
              u.firm_admin_id === userData.id && 
              u.account_type === 'associate' &&
              u.is_active !== false
            );
            
            console.log(`[EventForm] Loaded ${firmAssociates.length} associates for firm admin ${userData.id}`);
            setAssociates(firmAssociates);
            
            if (firmAssociates.length === 0) {
              console.warn('[EventForm] No associates found. User may need to invite associates first.');
            }
          } catch (err) {
            console.error('[EventForm] Error loading associates:', err);
            setError('Failed to load associates. Please try again.');
            setAssociates([]);
          }
          setIsLoadingAssociates(false);
        }
      } catch (err) {
        console.error('[EventForm] Error loading user:', err);
        setError('Failed to load user data. Please refresh the page.');
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadData();
  }, [event]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      type: eventType
    };

    // Ensure firm_id is set
    if (user?.account_type === 'law_firm_admin' && !eventData.firm_id) {
      eventData.firm_id = user.id;
    }

    // Map fields based on event type
    if (eventType === 'task') {
      eventData.due_date = formData.date;
      eventData.status = event?.status || 'pending';
      
      // Create or update task
      try {
        if (event && event.id) {
          await base44.entities.Task.update(event.id, eventData);
        } else {
          await base44.entities.Task.create(eventData);
        }
      } catch (error) {
        console.error('Error saving task:', error);
        return;
      }
    } else {
      eventData.hearing_date = formData.date;
      eventData.status = event?.status || 'scheduled';
      
      // Create or update hearing
      try {
        if (event && event.id) {
          await base44.entities.Hearing.update(event.id, eventData);
        } else {
          await base44.entities.Hearing.create(eventData);
        }
      } catch (error) {
        console.error('Error saving hearing:', error);
        return;
      }
    }

    onSave(eventData);
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${event.type}?`)) {
      try {
        if (event.type === 'task') {
          await base44.entities.Task.delete(event.id);
        } else {
          await base44.entities.Hearing.delete(event.id);
        }
        if (onDelete) {
          onDelete(event);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const getAssignedToOptions = () => {
    const options = [];
    
    if (user) {
      options.push({
        id: user.id,
        name: `Myself (${user.full_name || user.email})`
      });

      if (user.account_type === 'law_firm_admin' && associates.length > 0) {
        associates.forEach(associate => {
          options.push({
            id: associate.id,
            name: associate.full_name || associate.email
          });
        });
      }
    }

    return options;
  };

  if (isLoadingUser) {
    return (
      <Card className="shadow-lg border-0 max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading form...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>{event ? 'Edit Event' : 'Create New Event'}</span>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={() => setEventType('task')}
              variant={eventType === 'task' ? 'default' : 'outline'}
            >
              Task
            </Button>
            <Button
              type="button"
              onClick={() => setEventType('hearing')}
              variant={eventType === 'hearing' ? 'default' : 'outline'}
            >
              Hearing
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id">Case *</Label>
            <Select value={formData.case_id} onValueChange={(value) => handleChange('case_id', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.case_title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.case_id && (
             <Link to={createPageUrl(`Cases?view=${formData.case_id}`)} target="_blank">
                <Button variant="link" className="p-0 h-auto text-blue-600">
                  <Briefcase className="w-4 h-4 mr-2" />
                  View Case Details
                </Button>
            </Link>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date & Time *</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </div>
          
          {eventType === 'task' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select value={formData.task_type} onValueChange={(value) => handleChange('task_type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="filing">Filing</SelectItem>
                      <SelectItem value="client_meeting">Client Meeting</SelectItem>
                      <SelectItem value="document_review">Document Review</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="assigned_to" className="flex items-center gap-2">
                    Assigned To *
                    {isLoadingAssociates && <Loader2 className="w-4 h-4 animate-spin" />}
                  </Label>
                  <Select 
                    value={formData.assigned_to} 
                    onValueChange={(value) => handleChange('assigned_to', value)} 
                    required 
                    disabled={isLoadingAssociates}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingAssociates ? "Loading associates..." : "Select a user"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAssignedToOptions().map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user?.account_type === 'law_firm_admin' && associates.length === 0 && !isLoadingAssociates && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      No associates found. Invite associates from Team page.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_hours">Estimated Hours</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => handleChange('estimated_hours', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {eventType === 'hearing' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hearing_type">Hearing Type</Label>
                  <Select value={formData.hearing_type} onValueChange={(value) => handleChange('hearing_type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preliminary">Preliminary</SelectItem>
                      <SelectItem value="arguments">Arguments</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="judgment">Judgment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="court_room">Court Room</Label>
                    <Input
                      id="court_room"
                      value={formData.court_room}
                      onChange={(e) => handleChange('court_room', e.target.value)}
                    />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="judge_name">Judge Name</Label>
                <Input
                  id="judge_name"
                  value={formData.judge_name}
                  onChange={(e) => handleChange('judge_name', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-6 border-t">
            <div>
              {event && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}