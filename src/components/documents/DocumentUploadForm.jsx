
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // New import
import { Checkbox } from "@/components/ui/checkbox"; // New import
import { UploadFile } from "@/integrations/Core";
import { Document } from "@/entities/Document";
import { X, Save, Upload, File, Info } from 'lucide-react'; // New imports
import { useLocation } from 'react-router-dom'; // New import

export default function DocumentUploadForm({ cases, onCancel, onSuccess }) {
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    case_id: '',
    document_type: 'petition',
    description: '',
    is_confidential: false
  });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const caseId = params.get('case_id');
    if (caseId) {
      setFormData(prev => ({ ...prev, case_id: caseId }));
    }
  }, [location.search]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Automatically set title from file name, without extension
      setFormData(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    if (!formData.case_id || !formData.title || !formData.document_type) {
      alert('Please fill all required fields.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload the file
      const uploadResult = await UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      // 2. Create the Document entity record
      const docData = {
        ...formData,
        file_url: fileUrl,
        file_size: file.size,
        file_type: file.type,
        upload_date: new Date().toISOString()
      };

      await Document.create(docData);
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Document upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="shadow-2xl border-0 max-w-3xl mx-auto my-8">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Upload New Document</span>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="case_id">Case *</Label>
            <Select value={formData.case_id} onValueChange={(value) => handleChange('case_id', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select the associated case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_title} ({c.client_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Plaintiff's Initial Petition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type *</Label>
              <Select value={formData.document_type} onValueChange={(value) => handleChange('document_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petition">Petition</SelectItem>
                  <SelectItem value="affidavit">Affidavit</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="reply">Reply</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="other">Other</SelectItem> {/* Added 'Other' for completeness */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File Upload *</Label>
              <div className="flex items-center p-2 border rounded-md bg-slate-50">
                <File className="w-5 h-5 mr-3 text-slate-400" />
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.epub" // Expanded accepted file types based on common document formats
                  onChange={handleFileChange}
                  className="border-0 bg-transparent p-0 h-auto file:mr-3 file:font-semibold file:bg-slate-200 file:text-slate-700 file:rounded-md file:border-0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Briefly describe the document's purpose or content..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_confidential"
              checked={formData.is_confidential}
              onCheckedChange={(checked) => handleChange('is_confidential', checked)}
            />
            <Label htmlFor="is_confidential" className="flex items-center gap-2 text-sm"> {/* Added text-sm for better alignment */}
              Mark as Confidential <Info className="w-4 h-4 text-slate-500" />
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Upload & Save
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
