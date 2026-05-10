import React from 'react';
import { User, Bot, Copy, Share2, BookmarkPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function MessageBubble({ message, onAddToNotes }) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Research Answer',
                text: message.content
            });
        }
    };

    const getConfidenceBadge = (confidence) => {
        const colors = {
            high: 'bg-green-100 text-green-800',
            moderate: 'bg-yellow-100 text-yellow-800',
            limited: 'bg-red-100 text-red-800'
        };
        return colors[confidence] || colors.moderate;
    };

    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-blue-600" />
                </div>
            )}

            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl flex-1`}>
                <Card className={`p-4 ${isUser ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
                    <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>

                    {!isUser && message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-xs font-medium text-slate-600 mb-2">Sources Used:</div>
                            <div className="space-y-1">
                                {message.sources.map((source, idx) => (
                                    <div key={idx} className="text-xs text-slate-600 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                        <span>{source.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isUser && message.confidence && (
                        <div className="mt-2">
                            <Badge className={`text-xs ${getConfidenceBadge(message.confidence)}`}>
                                Confidence: {message.confidence}
                            </Badge>
                        </div>
                    )}
                </Card>

                {!isUser && (
                    <div className="flex gap-1 mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleShare}
                        >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => onAddToNotes(message)}
                        >
                            <BookmarkPlus className="w-3 h-3 mr-1" />
                            Add to Notes
                        </Button>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                </div>
            )}
        </div>
    );
}
