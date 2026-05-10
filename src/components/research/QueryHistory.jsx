import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  History,
  Search,
  Eye,
  Bookmark,
  Filter,
  Clock,
  FileText
} from "lucide-react";

const queryTypeLabels = {
  precedent_search: "Precedent Search",
  document_analysis: "Document Analysis", 
  case_brief: "Case Brief Research",
  legal_opinion: "Legal Opinion",
  statute_lookup: "Statute Lookup"
};

export default function QueryHistory({ queries, onSelectQuery }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredQueries, setFilteredQueries] = useState(queries);

  React.useEffect(() => {
    let filtered = queries;

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.query_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.query_type === typeFilter);
    }

    setFilteredQueries(filtered);
  }, [queries, searchTerm, typeFilter]);

  const getConfidenceBadge = (score) => {
    if (score >= 80) return { label: 'High', className: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', className: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search research history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="precedent_search">Precedent Search</SelectItem>
                <SelectItem value="document_analysis">Document Analysis</SelectItem>
                <SelectItem value="case_brief">Case Brief</SelectItem>
                <SelectItem value="legal_opinion">Legal Opinion</SelectItem>
                <SelectItem value="statute_lookup">Statute Lookup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Query History List */}
      <div className="space-y-4">
        {filteredQueries.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {queries.length === 0 ? 'No research history yet' : 'No matching queries'}
              </h3>
              <p className="text-slate-500">
                {queries.length === 0 
                  ? 'Your AI legal research queries will appear here after you conduct your first search.'
                  : 'Try adjusting your search terms or filters to find specific queries.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQueries.map((query) => {
            const confidence = getConfidenceBadge(query.confidence_score || 0);
            
            return (
              <Card key={query.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {queryTypeLabels[query.query_type] || query.query_type}
                        </Badge>
                        <Badge className={confidence.className}>
                          {confidence.label} Confidence
                        </Badge>
                        {query.bookmark && (
                          <Bookmark className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-slate-900 font-medium leading-relaxed line-clamp-3">
                        {query.query_text}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSelectQuery(query)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Results
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(query.created_date), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {query.research_status === 'completed' ? 'Completed' : 'Processing'}
                      </div>
                      {query.relevant_cases && (
                        <span>{query.relevant_cases.length} cases found</span>
                      )}
                    </div>
                    
                    {query.case_id && (
                      <Badge variant="secondary" className="text-xs">
                        Linked to Case
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}