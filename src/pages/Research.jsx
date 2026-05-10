import React, { useState, useEffect, useRef } from 'react';
import { Info, FileText, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RightSidebar from '../components/research/RightSidebar';
import MessageBubble from '../components/research/MessageBubble';
import ChatInput from '../components/research/ChatInput';
import { Case } from '@/entities/all';

const getAuthToken = () => localStorage.getItem('inkit_token') || localStorage.getItem('token');

export default function Research() {
  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState('cases');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mode state
  const [mode, setMode] = useState('research'); // 'case' or 'research'
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [researchSources, setResearchSources] = useState([]);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when case changes
  useEffect(() => {
    if (selectedCaseId && mode === 'case') {
      loadChatHistory(selectedCaseId);
    }
  }, [selectedCaseId]);

  // When tab or mode changes
  useEffect(() => {
    if (sidebarTab === 'cases') {
      if (selectedCaseId && selectedDocuments.length > 0) {
        setMode('case');
      }
    } else if (sidebarTab === 'research') {
      setMode('research');
      loadResearchChatHistory();
    }
  }, [sidebarTab, selectedCaseId, selectedDocuments]);

  const loadChatHistory = async (caseId) => {
    try {
      const response = await fetch(`/api/research-chat/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await response.json();
      setMessages(data.messages || []);
      setSelectedDocuments(data.selected_docs || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadResearchChatHistory = async () => {
    try {
      const response = await fetch('/api/research-chat/research/history', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load research chat:', error);
    }
  };

  const handleSelectCase = async (caseId) => {
    setSelectedCaseId(caseId);
    try {
      const caseData = await Case.findById(caseId);
      setSelectedCase(caseData);
    } catch (error) {
      console.error('Failed to load case:', error);
    }
  };

  const handleDocumentsChange = (docIds) => {
    setSelectedDocuments(docIds);
    if (docIds.length > 0 && selectedCaseId) {
      setMode('case');
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Validation
    if (mode === 'case' && selectedDocuments.length === 0) {
      alert('Please select at least one document from the case');
      return;
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/research-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          mode,
          case_id: mode === 'case' ? selectedCaseId : null,
          selected_documents: mode === 'case' ? selectedDocuments : [],
          message,
          research_sources: mode === 'research' ? researchSources : []
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. Please try again.`,
        confidence: 'limited',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToNotes = async (message) => {
    try {
      // Find the previous user message
      const messageIndex = messages.findIndex(m => m === message);
      const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

      const response = await fetch('/api/research-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          case_id: mode === 'case' ? selectedCaseId : null,
          question: userMessage?.content || 'Saved note',
          answer: message.content,
          sources: message.sources,
          confidence: message.confidence
        })
      });

      if (response.ok) {
        alert('Added to notes successfully!');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    }
  };

  const getModeDescription = () => {
    if (mode === 'case' && selectedCase) {
      return {
        title: `Case - ${selectedCase.case_title}`,
        subtitle: `Answering based on ${selectedDocuments.length} selected document${selectedDocuments.length !== 1 ? 's' : ''}`
      };
    }
    return {
      title: 'Research Mode',
      subtitle: 'Open legal research with access to legal databases'
    };
  };

  const modeInfo = getModeDescription();

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Area */}
        <div className={`flex-1 flex flex-col transition-all ${sidebarCollapsed ? 'mr-12' : 'mr-0'}`}>
          {/* Mode indicator */}
          <div className="bg-white border-b p-4">
            <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg">{modeInfo.title}</h1>
                  <p className="text-sm text-slate-600">{modeInfo.subtitle}</p>
                </div>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Info className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {mode === 'case' ? 'Case Chat' : 'Legal Research Assistant'}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    {mode === 'case'
                      ? 'Ask questions about the selected documents. The AI will only use information from these documents.'
                      : 'Get comprehensive legal research help. Ask about statutes, precedents, and legal principles.'}
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <MessageBubble
                  key={idx}
                  message={msg}
                  onAddToNotes={handleAddToNotes}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            mode={mode}
            placeholder={
              mode === 'case'
                ? 'Ask about the selected documents...'
                : 'Ask about legal research, precedents, or statutes...'
            }
          />
        </div>

        {/* Right: Sidebar */}
        <RightSidebar
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          selectedCaseId={selectedCaseId}
          onSelectCase={handleSelectCase}
          selectedDocuments={selectedDocuments}
          onDocumentsChange={handleDocumentsChange}
          researchSources={researchSources}
          onSourcesChange={setResearchSources}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
    </div>
  );
}