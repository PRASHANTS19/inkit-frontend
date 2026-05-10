import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, FileText, Link as LinkIcon, Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ResearchTab({ sources, onSourcesChange }) {
    const [showAddSource, setShowAddSource] = useState(false);
    const [newSource, setNewSource] = useState({
        title: '',
        source_type: 'citation',
        content: '',
        metadata: ''
    });

    const sourceIcons = {
        document: FileText,
        citation: BookOpen,
        statute: Scale,
        link: LinkIcon
    };

    const handleAddSource = () => {
        if (!newSource.title) return;

        const source = {
            id: Date.now().toString(),
            ...newSource,
            created_date: new Date().toISOString()
        };

        onSourcesChange([...sources, source]);
        setNewSource({ title: '', source_type: 'citation', content: '', metadata: '' });
        setShowAddSource(false);
    };

    const handleRemoveSource = (sourceId) => {
        onSourcesChange(sources.filter(s => s.id !== sourceId));
    };

    return (
        <div className="space-y-3 mt-4">
            {/* Default Sources */}
            <div>
                <h3 className="text-xs font-medium text-slate-600 mb-2">Default Sources</h3>
                <div className="space-y-1">
                    {[
                        { name: 'Supreme Court Database', icon: Scale },
                        { name: 'High Court Database', icon: Scale },
                        { name: 'Statutes & Acts', icon: BookOpen },
                        { name: 'Firm Library', icon: FileText }
                    ].map((item) => (
                        <Card key={item.name} className="p-2 bg-slate-50 border-slate-200">
                            <div className="flex items-center gap-2">
                                <item.icon className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs text-slate-700">{item.name}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* User Sources */}
            {sources.length > 0 && (
                <div>
                    <h3 className="text-xs font-medium text-slate-600 mb-2">Your Sources</h3>
                    <div className="space-y-1">
                        {sources.map((source) => {
                            const Icon = sourceIcons[source.source_type] || FileText;
                            return (
                                <Card key={source.id} className="p-2 group hover:bg-slate-50">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <Icon className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-medium truncate">{source.title}</div>
                                                <div className="text-xs text-slate-500 capitalize">{source.source_type}</div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                            onClick={() => handleRemoveSource(source.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Source Button */}
            <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAddSource(true)}
            >
                <Plus className="w-4 h-4 mr-2" />
                Add New Source
            </Button>

            {/* Add Source Dialog */}
            <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Research Source</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Source Type</Label>
                            <Select
                                value={newSource.source_type}
                                onValueChange={(value) => setNewSource({ ...newSource, source_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="citation">Case Citation</SelectItem>
                                    <SelectItem value="statute">Statute/Act</SelectItem>
                                    <SelectItem value="document">Document Upload</SelectItem>
                                    <SelectItem value="link">External Link</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g., Kesavananda Bharati v. State of Kerala"
                                value={newSource.title}
                                onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Content / Citation</Label>
                            <Textarea
                                placeholder="Enter case details, statute text, or URL..."
                                rows={4}
                                value={newSource.content}
                                onChange={(e) => setNewSource({ ...newSource, content: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAddSource(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddSource}>Add Source</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
