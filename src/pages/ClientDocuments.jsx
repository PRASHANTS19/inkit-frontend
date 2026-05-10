
import React, { useState, useEffect } from 'react';
import { User, Case, Document } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClientDocuments() {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                const clientCases = await Case.filter({ client_id: currentUser.id });
                if (clientCases.length > 0) {
                    const caseIds = clientCases.map(c => c.id);
                    const caseDocuments = await Document.filter({ case_id: { $in: caseIds } }, '-created_date');

                    // Add case title to each document
                    const documentsWithCaseInfo = caseDocuments.map(doc => {
                        const caseInfo = clientCases.find(c => c.id === doc.case_id);
                        return { ...doc, case_title: caseInfo?.case_title || 'N/A' };
                    });

                    setDocuments(documentsWithCaseInfo);
                }
            } catch (err) {
                setError('Failed to load your documents. Please try again later.');
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

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    My Documents
                </h1>
                <Card>
                    <CardContent className="p-6 space-y-3">
                        {documents.length > 0 ? documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                                <div>
                                    <p className="font-semibold text-slate-800">{doc.title}</p>
                                    <p className="text-sm text-slate-500">Case: {doc.case_title}</p>
                                    <p className="text-xs text-slate-400">Uploaded: {format(new Date(doc.upload_date), 'PPP')}</p>
                                </div>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </a>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">No documents found for your cases.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
