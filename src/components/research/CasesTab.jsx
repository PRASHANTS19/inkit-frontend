import React, { useState, useEffect } from 'react';
import { Case, Document } from '@/entities/all';
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CasesTab({
    selectedCaseId,
    onSelectCase,
    selectedDocuments,
    onDocumentsChange
}) {
    const [cases, setCases] = useState([]);
    const [caseDocuments, setCaseDocuments] = useState({});
    const [expandedCase, setExpandedCase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCases();
    }, []);

    useEffect(() => {
        if (selectedCaseId && !expandedCase) {
            setExpandedCase(selectedCaseId);
            loadDocuments(selectedCaseId);
        }
    }, [selectedCaseId]);

    const loadCases = async () => {
        try {
            const casesList = await Case.list('-created_date', 50);
            setCases(casesList);
        } catch (error) {
            console.error('Failed to load cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async (caseId) => {
        if (caseDocuments[caseId]) return; // Already loaded

        try {
            const docs = await Document.filter({ case_id: caseId });
            setCaseDocuments(prev => ({ ...prev, [caseId]: docs }));
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    };

    const toggleCase = (caseId) => {
        if (expandedCase === caseId) {
            setExpandedCase(null);
        } else {
            setExpandedCase(caseId);
            loadDocuments(caseId);
        }
    };

    const handleCaseSelect = (caseItem) => {
        onSelectCase(caseItem.id);
        if (!caseDocuments[caseItem.id]) {
            loadDocuments(caseItem.id);
        }
        if (expandedCase !== caseItem.id) {
            setExpandedCase(caseItem.id);
        }
    };

    const toggleDocument = (docId) => {
        const newSelection = selectedDocuments.includes(docId)
            ? selectedDocuments.filter(id => id !== docId)
            : [...selectedDocuments, docId];
        onDocumentsChange(newSelection);
    };

    if (loading) {
        return (
            <div className="py-8 text-center text-sm text-slate-500">
                Loading cases...
            </div>
        );
    }

    if (cases.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-slate-500">
                <Folder className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No cases found</p>
                <p className="text-xs mt-1">Create a case to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 mt-4">
            {cases.map((caseItem) => {
                const isExpanded = expandedCase === caseItem.id;
                const docs = caseDocuments[caseItem.id] || [];
                const isSelected = selectedCaseId === caseItem.id;

                return (
                    <Card key={caseItem.id} className={`p-0 overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                        <Button
                            variant="ghost"
                            className="w-full justify-start p-3 h-auto hover:bg-slate-50"
                            onClick={() => toggleCase(caseItem.id)}
                        >
                            <div className="flex items-start gap-2 w-full">
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">{caseItem.case_title}</div>
                                    <div className="text-xs text-slate-500">
                                        {caseItem.case_type} • {new Date(caseItem.created_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </Button>

                        {isExpanded && (
                            <div className="border-t bg-slate-50/50">
                                <div className="p-2 space-y-1">
                                    {docs.length === 0 ? (
                                        <div className="text-xs text-slate-500 px-2 py-4 text-center">
                                            No documents in this case
                                        </div>
                                    ) : (
                                        <>
                                            <div className="px-2 py-1">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-xs text-blue-600"
                                                    onClick={() => handleCaseSelect(caseItem)}
                                                >
                                                    Use this case
                                                </Button>
                                            </div>
                                            {docs.map((doc) => (
                                                <label
                                                    key={doc.id}
                                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedDocuments.includes(doc.id)}
                                                        onCheckedChange={() => toggleDocument(doc.id)}
                                                    />
                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium truncate">{doc.title}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(doc.upload_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
