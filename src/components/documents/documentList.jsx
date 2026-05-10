import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Briefcase, Calendar, Download, Edit } from 'lucide-react';
import { format } from 'date-fns';
import PdfViewer from './PdfViewer';

export default function DocumentList({ documents, isLoading }) {
  const [viewingDocument, setViewingDocument] = useState(null);
  if (isLoading) {
    return <div>Loading documents...</div>;
  }
  
  if (documents.length === 0) {
    return (
      <Card className="text-center p-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading your first case document.</p>
      </Card>
    );
  }

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewingDocument) {
    return <PdfViewer document={viewingDocument} onClose={() => setViewingDocument(null)} />;
  }

  return (
    <div className="space-y-4">
      {documents.map(doc => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">{doc.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      Case: {doc.case_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(doc.upload_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {doc.document_type?.replace('_', ' ')}
                    </Badge>
                    {doc.is_confidential && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Confidential
                      </Badge>
                    )}
                    {doc.file_size && (
                      <span className="text-xs text-gray-500">
                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setViewingDocument(doc)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View & Annotate
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload(doc)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}