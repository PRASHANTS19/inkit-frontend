import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import SnippetCard from './SnippetCard';
import { PlusCircle, Book } from 'lucide-react';

export default function Workspace({ documentTitle, snippets, onAddNote, onDeleteSnippet, onSummarize, onReorderSnippets }) {
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const handleSaveNote = () => {
    if (newNoteText.trim()) {
      onAddNote(newNoteText.trim());
      setNewNoteText('');
      setIsAddingNote(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="pb-4 border-b mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6 text-blue-600" />
          Workspace
        </h2>
        <p className="text-sm text-slate-500">{documentTitle}</p>
      </div>

      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {snippets.map(snippet => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            onDelete={onDeleteSnippet}
            onSummarize={() => onSummarize(snippet.content)}
          />
        ))}
      </div>
      
      <div className="pt-4 border-t mt-4">
        {isAddingNote ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Type your note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAddingNote(false)}>Cancel</Button>
              <Button onClick={handleSaveNote}>Save Note</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsAddingNote(true)} className="w-full">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>
    </div>
  );
}