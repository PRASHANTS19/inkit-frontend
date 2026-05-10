
import React, { useState, useEffect } from "react";
import { Document, Case } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, FileText, Upload, Brain, Eye, Edit } from "lucide-react";

import DocumentUploadForm from "../components/documents/DocumentUploadForm";
import DocumentList from "../components/documents/DocumentList";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docData, caseData] = await Promise.all([
        Document.list('-created_date'),
        Case.list()
      ]);
      setDocuments(docData);
      setCases(caseData);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
    setIsLoading(false);
  };

  const onUploadSuccess = () => {
    setShowUploadForm(false);
    loadData();
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.case_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Document Workspace</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Upload, annotate, and analyze your case documents with AI-powered insights and advanced PDF annotation tools.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-3" />
            Upload New Document
          </Button>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-powered text extraction and analysis
          </div>
        </div>

        {showUploadForm && (
          <DocumentUploadForm
            cases={cases}
            onCancel={() => setShowUploadForm(false)}
            onSuccess={onUploadSuccess}
          />
        )}

        {!showUploadForm && (
          <>
            {/* Search Bar */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search documents by title, case, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <Eye className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold text-slate-900 mb-2">Canvas PDF Viewer</h3>
                <p className="text-sm text-slate-600">View PDFs directly in your browser with zoom, rotation, and full-screen support</p>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <Edit className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold text-slate-900 mb-2">Touch Annotations</h3>
                <p className="text-sm text-slate-600">Apple Pencil, stylus, and touch support for highlighting and freehand drawing</p>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <Brain className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
                <p className="text-sm text-slate-600">Extract text, summarize content, and create searchable annotations</p>
              </Card>
            </div>

            <DocumentList documents={filteredDocuments} isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}
