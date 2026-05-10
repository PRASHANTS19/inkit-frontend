import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Upload, Loader2 } from "lucide-react";

export default function LibraryUploadForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'bare_act',
    tags: '',
    summary: '',
    file_url: '',
  });
  const [file, setFile] = useState(null);
  const [generateSummary, setGenerateSummary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFormData(prev => ({
        ...prev,
        title: prev.title || selectedFile.name.replace(/\.[^/.]+$/, "")
      }));
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

    setIsUploading(true);
    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      // Generate AI summary if requested
      let summary = formData.summary;
      if (generateSummary && !summary) {
        try {
          const summaryResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Provide a concise 2-3 sentence summary of this legal document titled "${formData.title}" in the category "${formData.category}". Focus on key legal provisions and applicability.`,
            add_context_from_internet: false,
            file_urls: [fileUrl]
          });
          summary = summaryResult;
        } catch (error) {
          console.error('Error generating summary:', error);
        }
      }

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Save to database
      await onSave({
        title: formData.title,
        file_url: fileUrl,
        category: formData.category,
        tags,
        summary
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="shadow-2xl border-0 max-w-3xl mx-auto my-8">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Add Legal Resource</span>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Indian Contract Act, 1872"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bare_act">Bare Act</SelectItem>
                  <SelectItem value="draft_template">Draft Template</SelectItem>
                  <SelectItem value="research_paper">Research Paper</SelectItem>
                  <SelectItem value="case_law">Case Law</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File Upload *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="e.g., contract law, civil, section 10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              placeholder="Brief description of the document..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="generateSummary"
              checked={generateSummary}
              onCheckedChange={setGenerateSummary}
            />
            <Label htmlFor="generateSummary" className="text-sm">
              Generate AI summary from document content
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add to Library
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}