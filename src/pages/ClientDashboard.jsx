
import React, { useState, useEffect } from 'react';
import { User, Case, Hearing, Document } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, FileText, Download, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        const clientCases = await Case.filter({ client_id: currentUser.id });
        setCases(clientCases);

        if (clientCases.length > 0) {
          const caseIds = clientCases.map(c => c.id);

          const caseHearings = await Hearing.filter({ case_id: { $in: caseIds } }, 'hearing_date');
          setHearings(caseHearings);

          const caseDocuments = await Document.filter({ case_id: { $in: caseIds } }, '-created_date');
          setDocuments(caseDocuments);
        }
      } catch (err) {
        setError('Failed to load your data. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const upcomingHearings = hearings.filter(h => new Date(h.hearing_date) >= new Date());

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {user?.full_name || 'Client'}
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Cases */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase /> My Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cases.length > 0 ? cases.map(c => (
                <div key={c.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{c.case_title}</h3>
                    <Badge>{c.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{c.case_number}</p>
                </div>
              )) : <p className="text-slate-500">You are not yet associated with any cases.</p>}
            </CardContent>
          </Card>

          {/* Upcoming Hearings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar /> Upcoming Hearings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingHearings.length > 0 ? upcomingHearings.map(h => (
                <div key={h.id} className="p-3 bg-amber-50 rounded-lg">
                  <p className="font-semibold">{h.hearing_type}</p>
                  <p className="text-sm">{format(new Date(h.hearing_date), 'PPP p')}</p>
                  <p className="text-xs text-slate-600">Case: {cases.find(c => c.id === h.case_id)?.case_title}</p>
                </div>
              )) : <p className="text-slate-500">No upcoming hearings scheduled.</p>}
            </CardContent>
          </Card>
        </div>

        {/* My Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText /> Documents & Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.length > 0 ? documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-slate-500">Uploaded on {format(new Date(doc.upload_date), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </a>
                </div>
              </div>
            )) : <p className="text-slate-500">No documents have been uploaded for your cases yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
