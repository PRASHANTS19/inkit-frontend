import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  FileText,
  Scale,
  BookOpen,
  Lightbulb,
  Target,
  Star,
  Copy,
  Download,
  Bookmark,
  Clock
} from "lucide-react";

export default function ResearchResults({ results, query }) {
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const formatConfidenceScore = (score) => {
    if (score >= 80) return { label: 'High', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-red-500' };
  };

  const confidence = formatConfidenceScore(results.confidence_score || 85);

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Research Results
              </CardTitle>
              <p className="text-slate-700 italic">"{query}"</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${confidence.color} text-white`}>
                {confidence.label} Confidence
              </Badge>
              {results.created_date && (
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  {format(new Date(results.created_date), 'MMM d, h:mm a')}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Results Tabs */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="statutes">Statutes</TabsTrigger>
          <TabsTrigger value="precedents">Cases</TabsTrigger>
          <TabsTrigger value="arguments">Arguments</TabsTrigger>
          <TabsTrigger value="advice">Advice</TabsTrigger>
        </TabsList>

        {/* Legal Analysis */}
        <TabsContent value="analysis">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-slate-600" />
                  Legal Analysis
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(results.legal_analysis, 'analysis')}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copiedText === 'analysis' ? 'Copied!' : 'Copy'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {results.legal_analysis}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relevant Statutes */}
        <TabsContent value="statutes">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-600" />
                Relevant Statutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.relevant_statutes && results.relevant_statutes.length > 0 ? (
                <div className="space-y-4">
                  {results.relevant_statutes.map((statute, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900">{statute.act_name}</h4>
                        <Badge variant="outline">{statute.section}</Badge>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {statute.relevance}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">
                  No specific statutes identified in this research.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Case Precedents */}
        <TabsContent value="precedents">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                Case Precedents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.case_precedents && results.case_precedents.length > 0 ? (
                <div className="space-y-4">
                  {results.case_precedents.map((case_item, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{case_item.case_name}</h4>
                          <p className="text-sm text-slate-600 font-medium">{case_item.citation}</p>
                        </div>
                        {case_item.relevance_score && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium">{case_item.relevance_score}/10</span>
                          </div>
                        )}
                      </div>
                      
                      {case_item.key_principle && (
                        <div className="mb-2">
                          <Badge className="bg-blue-100 text-blue-800 mb-2">Key Principle</Badge>
                          <p className="text-sm text-slate-700 font-medium italic">
                            {case_item.key_principle}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {case_item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">
                  No specific case precedents identified in this research.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Arguments */}
        <TabsContent value="arguments">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-600" />
                Legal Arguments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.legal_arguments && results.legal_arguments.length > 0 ? (
                <div className="space-y-4">
                  {results.legal_arguments.map((argument, index) => (
                    <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900">Argument #{index + 1}</h4>
                        <Badge 
                          className={
                            argument.strength === 'Strong' ? 'bg-green-100 text-green-800' :
                            argument.strength === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {argument.strength}
                        </Badge>
                      </div>
                      <p className="text-slate-700 mb-3 leading-relaxed">{argument.argument}</p>
                      {argument.supporting_law && (
                        <div className="text-sm">
                          <span className="font-medium text-slate-600">Legal Basis: </span>
                          <span className="text-slate-700">{argument.supporting_law}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">
                  No specific arguments provided in this research.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practical Advice */}
        <TabsContent value="advice">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-slate-600" />
                  Practical Advice & Strategy
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(results.practical_advice, 'advice')}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copiedText === 'advice' ? 'Copied!' : 'Copy'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {results.practical_advice}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Bookmark Research
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Create Case Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}