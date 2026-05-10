import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Download,
  Eye,
  Trash2,
  Filter,
  Loader2,
  Scale,
  File,
  Layers
} from "lucide-react";

import LibraryUploadForm from "../components/library/LibraryUploadForm";
import LibraryDocumentViewer from "../components/library/LibraryDocumentViewer";
import { MergePDFModal } from "../components/library/MergePDFModal";

export default function Library() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['libraryDocuments'],
    queryFn: () => base44.entities.LibraryDocument.list('-created_date', 200),
    staleTime: 60 * 1000,
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleSaveDocument = async (docData) => {
    try {
      await base44.entities.LibraryDocument.create(docData);
      queryClient.invalidateQueries({ queryKey: ['libraryDocuments'] });
      setShowUploadForm(false);
    } catch (error) {
      console.error('Error saving library document:', error);
      alert(`Failed to save document: ${error.message}`);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from the library?')) {
      return;
    }
    try {
      await base44.entities.LibraryDocument.delete(docId);
      queryClient.invalidateQueries({ queryKey: ['libraryDocuments'] });
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error.message}`);
    }
  };

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canUpload = currentUser?.account_type !== 'associate';
  const canDelete = currentUser?.account_type !== 'associate';

  const categoryIcons = {
    bare_act: Scale,
    draft_template: FileText,
    research_paper: BookOpen,
    case_law: File,
    other: File
  };

  const categoryColors = {
    bare_act: 'bg-blue-100 text-blue-800',
    draft_template: 'bg-green-100 text-green-800',
    research_paper: 'bg-purple-100 text-purple-800',
    case_law: 'bg-amber-100 text-amber-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const getCategoryLabel = (category) => {
    return category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other';
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Legal Resource Library
            </h1>
            <p className="text-slate-600 mt-1">
              Access bare acts, drafts, precedents, and legal research materials
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowMergeModal(true)}
              variant="outline"
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Layers className="w-4 h-4 mr-2" />
              Merge PDFs
            </Button>
            {canUpload && (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            )}
          </div>
        </div>

        {showMergeModal && (
          <MergePDFModal onClose={() => setShowMergeModal(false)} />
        )}

        {showUploadForm && (
          <LibraryUploadForm
            onSave={handleSaveDocument}
            onCancel={() => setShowUploadForm(false)}
          />
        )}

        {selectedDocument && (
          <LibraryDocumentViewer
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onDelete={canDelete ? handleDeleteDocument : null}
          />
        )}

        {!showUploadForm && !selectedDocument && (
          <>
            {/* Search and Filters */}
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search by title or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={categoryFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={categoryFilter === 'bare_act' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('bare_act')}
                    >
                      <Scale className="w-4 h-4 mr-1" />
                      Bare Acts
                    </Button>
                    <Button
                      variant={categoryFilter === 'draft_template' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('draft_template')}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Templates
                    </Button>
                    <Button
                      variant={categoryFilter === 'research_paper' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('research_paper')}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Research
                    </Button>
                    <Button
                      variant={categoryFilter === 'case_law' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('case_law')}
                    >
                      Case Law
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4 text-center">
                  <Scale className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.category === 'bare_act').length}
                  </p>
                  <p className="text-xs opacity-90">Bare Acts</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.category === 'draft_template').length}
                  </p>
                  <p className="text-xs opacity-90">Templates</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.category === 'research_paper').length}
                  </p>
                  <p className="text-xs opacity-90">Research</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <CardContent className="p-4 text-center">
                  <File className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.category === 'case_law').length}
                  </p>
                  <p className="text-xs opacity-90">Case Laws</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-xs opacity-90">Total Resources</p>
                </CardContent>
              </Card>
            </div>

            {/* Documents Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchTerm ? 'No documents found' : 'No resources yet'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search or filters'
                      : 'Start building your legal resource library'
                    }
                  </p>
                  {canUpload && !searchTerm && (
                    <Button onClick={() => setShowUploadForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Resource
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => {
                  const CategoryIcon = categoryIcons[doc.category] || File;
                  return (
                    <Card key={doc.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-lg ${categoryColors[doc.category]} flex items-center justify-center`}>
                            <CategoryIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">
                              {doc.title}
                            </h3>
                            <Badge className={categoryColors[doc.category]}>
                              {getCategoryLabel(doc.category)}
                            </Badge>
                          </div>
                        </div>

                        {doc.summary && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                            {doc.summary}
                          </p>
                        )}

                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {doc.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{doc.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            onClick={() => setSelectedDocument(doc)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleDownload(doc)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          {canDelete && (
                            <Button
                              onClick={() => handleDeleteDocument(doc.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}