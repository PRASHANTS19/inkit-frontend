import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Brain,
  FileText,
  Search,
  BookOpen,
  Scale,
  Lightbulb
} from "lucide-react";

const queryTypes = [
  { value: 'precedent_search', label: 'Precedent Search', icon: Scale },
  { value: 'document_analysis', label: 'Document Analysis', icon: FileText },
  { value: 'case_brief', label: 'Case Brief Research', icon: BookOpen },
  { value: 'legal_opinion', label: 'Legal Opinion', icon: Lightbulb },
  { value: 'statute_lookup', label: 'Statute Lookup', icon: Search }
];

const sampleQueries = [
  "What are the grounds for challenging an arbitration award under the Arbitration and Conciliation Act, 2015?",
  "Analysis of Section 138 of Negotiable Instruments Act - dishonor of cheque cases",
  "Recent Supreme Court judgments on dowry harassment under Section 498A IPC",
  "GST implications for e-commerce transactions and liability of marketplace",
  "Bail provisions under CrPC for non-bailable offenses - recent developments"
];

export default function QueryForm({ onSubmit, isLoading, currentQuery }) {
  const [formData, setFormData] = useState({
    query_text: currentQuery || '',
    query_type: 'precedent_search',
    case_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.query_text.trim()) return;
    onSubmit(formData);
  };

  const handleSampleQuery = (query) => {
    setFormData(prev => ({ ...prev, query_text: query }));
  };

  return (
    <div className="space-y-6">
      {/* Query Form */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Brain className="w-6 h-6 text-blue-600" />
            Legal Research Query
          </CardTitle>
          <p className="text-slate-600">
            Ask detailed legal questions to get comprehensive research with case law, statutes, and strategic analysis.
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Query Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="query_type">Research Type</Label>
              <Select 
                value={formData.query_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, query_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select research type" />
                </SelectTrigger>
                <SelectContent>
                  {queryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Main Query Input */}
            <div className="space-y-2">
              <Label htmlFor="query_text">Legal Question or Topic</Label>
              <Textarea
                id="query_text"
                value={formData.query_text}
                onChange={(e) => setFormData(prev => ({ ...prev, query_text: e.target.value }))}
                placeholder="Enter your legal research question or describe the topic you want to research..."
                rows={6}
                className="min-h-32"
                required
              />
              <p className="text-sm text-slate-500">
                Be specific about the legal issues, jurisdiction, and any particular aspects you want to focus on.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading || !formData.query_text.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Researching...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start AI Research
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sample Queries */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Sample Research Queries
          </CardTitle>
          <p className="text-sm text-slate-600">
            Click on any sample query to get started with AI legal research
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {sampleQueries.map((query, index) => (
            <div
              key={index}
              onClick={() => handleSampleQuery(query)}
              className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
            >
              <p className="text-sm text-slate-700 leading-relaxed">{query}</p>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="outline" className="text-xs">
                  Click to use
                </Badge>
                <Search className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Research Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lightbulb className="w-5 h-5" />
            Research Tips
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 text-sm text-amber-800">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2"></div>
              <span>Be specific about the legal area, jurisdiction, and particular issues you want to research</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2"></div>
              <span>Include relevant case details, sections, or Acts you want the AI to focus on</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2"></div>
              <span>Ask for specific types of analysis like precedents, arguments, or practical advice</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2"></div>
              <span>The AI focuses on Indian law and will provide relevant case citations and statutory references</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}