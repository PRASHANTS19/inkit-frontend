import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, GripVertical } from 'lucide-react';

export default function SnippetCard({ snippet, onDelete, onSummarize }) {
  const typeColors = {
    snippet: 'border-blue-500 bg-blue-50',
    note: 'border-yellow-500 bg-yellow-50',
    summary: 'border-green-500 bg-green-50'
  };

  return (
    <Card className={`border-l-4 ${typeColors[snippet.type] || 'border-gray-500 bg-gray-50'}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="cursor-grab p-1 text-slate-400">
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <p className="text-slate-700 leading-relaxed">{snippet.content}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{snippet.type}</Badge>
                {snippet.page_number && (
                  <Badge variant="outline">Page {snippet.page_number}</Badge>
                )}
              </div>
              <div className="flex gap-1">
                {snippet.type === 'snippet' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSummarize}>
                    <FileText className="w-4 h-4 text-green-600" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(snippet.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}