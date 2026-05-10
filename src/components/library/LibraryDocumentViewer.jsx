import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";

export default function LibraryDocumentViewer({ document, onClose, onDelete }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = document.title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryLabel = (category) => {
    return category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other';
  };

  return (
    <Card className="shadow-2xl border-0 max-w-6xl mx-auto my-8">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <span>Library Document</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Document Info */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{document.title}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {getCategoryLabel(document.category)}
              </Badge>
              {document.tags?.map((tag, idx) => (
                <Badge key={idx} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {onDelete && (
              <Button
                onClick={() => onDelete(document.id)}
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        {document.summary && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
            <p className="text-slate-700 leading-relaxed">{document.summary}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Added On</p>
            <p className="font-semibold text-slate-900">
              {format(new Date(document.created_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Added By</p>
            <p className="font-semibold text-slate-900">{document.created_by || 'System'}</p>
          </div>
          <div>
            <p className="text-slate-500">Category</p>
            <p className="font-semibold text-slate-900">{getCategoryLabel(document.category)}</p>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="border rounded-lg overflow-hidden bg-slate-50">
          <div className="h-[600px]">
            <object
              data={document.file_url}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="p-8 text-center">
                <p className="text-slate-600 mb-4">
                  Your browser does not support embedded PDFs.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Document
                </Button>
              </div>
            </object>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}