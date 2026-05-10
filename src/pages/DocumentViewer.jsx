import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Document, Snippet } from '@/entities/all';

import PdfViewer from '../components/documents/PdfViewer';
import Workspace from '../components/documents/Workspace';
import { InvokeLLM } from '@/integrations/Core';

export default function DocumentViewer() {
  const location = useLocation();
  const [doc, setDoc] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDocId = () => new URLSearchParams(location.search).get('id');

  useEffect(() => {
    const docId = getDocId();
    if (docId) {
      loadData(docId);
    }
  }, [location.search]);

  const loadData = async (docId) => {
    setIsLoading(true);
    try {
      const [docData, snippetData] = await Promise.all([
        Document.get(docId),
        Snippet.filter({ document_id: docId })
      ]);
      setDoc(docData);
      setSnippets(snippetData);
    } catch (error) {
      console.error("Error loading document and snippets:", error);
    }
    setIsLoading(false);
  };

  const handleAddSnippet = async (text, pageNumber) => {
    if (!doc) return;
    const newSnippet = await Snippet.create({
      document_id: doc.id,
      case_id: doc.case_id,
      content: text,
      page_number: pageNumber,
      type: 'snippet',
    });
    setSnippets(prev => [...prev, newSnippet]);
  };

  const handleAddNote = async (text) => {
    if (!doc) return;
    const newNote = await Snippet.create({
      document_id: doc.id,
      case_id: doc.case_id,
      content: text,
      type: 'note',
    });
    setSnippets(prev => [...prev, newNote]);
  };

  const handleSummarize = async (text) => {
    if (!doc || !text) return;
    try {
      const summary = await InvokeLLM({
        prompt: `Please summarize the following legal text concisely:\n\n${text}`
      });
      const newSummary = await Snippet.create({
        document_id: doc.id,
        case_id: doc.case_id,
        content: `Summary: ${summary}`,
        type: 'summary',
      });
      setSnippets(prev => [...prev, newSummary]);
    } catch (error) {
      console.error("Failed to summarize:", error);
    }
  };

  const handleDeleteSnippet = async (id) => {
    await Snippet.delete(id);
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const handleReorderSnippets = (newOrder) => {
    setSnippets(newOrder);
    // Here you would typically update the position/order in the backend
  };

  if (isLoading) return <div className="p-8">Loading Document...</div>;
  if (!doc) return <div className="p-8">Document not found.</div>;

  return (
    <div className="flex h-screen bg-slate-100">
      <div className="w-1/2 h-full overflow-y-auto">
        <PdfViewer
          fileUrl={doc.file_url}
          extractedText={doc.extracted_text}
          onAddSnippet={handleAddSnippet}
          onSummarize={handleSummarize}
        />
      </div>
      <div className="w-1/2 h-full overflow-y-auto border-l bg-white">
        <Workspace
          documentTitle={doc.title}
          snippets={snippets}
          onAddNote={handleAddNote}
          onDeleteSnippet={handleDeleteSnippet}
          onSummarize={handleSummarize}
          onReorderSnippets={handleReorderSnippets}
        />
      </div>
    </div>
  );
}