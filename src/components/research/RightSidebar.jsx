import React, { useState, useEffect } from 'react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CasesTab from './CasesTab';
import ResearchTab from './ResearchTab';

export default function RightSidebar({
    activeTab,
    onTabChange,
    selectedCaseId,
    onSelectCase,
    selectedDocuments,
    onDocumentsChange,
    researchSources,
    onSourcesChange,
    isCollapsed,
    onToggleCollapse
}) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        // Mobile: Slide-in panel
        return (
            <>
                {/* Overlay */}
                {!isCollapsed && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={onToggleCollapse}
                    />
                )}

                {/* Slide-in panel */}
                <div
                    className={`fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-2xl z-50 transform transition-transform duration-300 ${isCollapsed ? 'translate-x-full' : 'translate-x-0'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-semibold">Research Sources</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleCollapse}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
                                <TabsTrigger value="cases">Cases</TabsTrigger>
                                <TabsTrigger value="research">Research</TabsTrigger>
                            </TabsList>

                            <TabsContent value="cases" className="flex-1 overflow-auto px-4">
                                <CasesTab
                                    selectedCaseId={selectedCaseId}
                                    onSelectCase={onSelectCase}
                                    selectedDocuments={selectedDocuments}
                                    onDocumentsChange={onDocumentsChange}
                                />
                            </TabsContent>

                            <TabsContent value="research" className="flex-1 overflow-auto px-4">
                                <ResearchTab
                                    sources={researchSources}
                                    onSourcesChange={onSourcesChange}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </>
        );
    }

    // Desktop: Collapsible right sidebar
    return (
        <div className={`relative h-full border-l bg-white transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'
            }`}>
            {/* Toggle button */}
            <Button
                variant="ghost"
                size="sm"
                className="absolute -left-3 top-4 z-10 h-6 w-6 p-0 rounded-full border bg-white shadow-md"
                onClick={onToggleCollapse}
            >
                {isCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </Button>

            {!isCollapsed && (
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-sm">Research Sources</h2>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
                            <TabsTrigger value="cases">Cases</TabsTrigger>
                            <TabsTrigger value="research">Research</TabsTrigger>
                        </TabsList>

                        <TabsContent value="cases" className="flex-1 overflow-auto px-4 pb-4">
                            <CasesTab
                                selectedCaseId={selectedCaseId}
                                onSelectCase={onSelectCase}
                                selectedDocuments={selectedDocuments}
                                onDocumentsChange={onDocumentsChange}
                            />
                        </TabsContent>

                        <TabsContent value="research" className="flex-1 overflow-auto px-4 pb-4">
                            <ResearchTab
                                sources={researchSources}
                                onSourcesChange={onSourcesChange}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
