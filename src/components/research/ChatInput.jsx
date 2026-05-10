import React, { useState, useRef } from 'react';
import { Send, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function ChatInput({ onSendMessage, isLoading, mode, placeholder }) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message.trim());
            setMessage('');
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handlePlusOption = (option) => {
        let prompt = '';
        switch (option) {
            case 'precedents':
                prompt = mode === 'case'
                    ? 'Find relevant precedents based on the legal issues in these documents.'
                    : 'Find recent Supreme Court precedents on ';
                break;
            case 'summary':
                prompt = mode === 'case'
                    ? 'Provide a comprehensive summary of the selected documents.'
                    : 'Summarize the key legal principles discussed.';
                break;
            case 'arguments':
                prompt = mode === 'case'
                    ? 'Suggest legal arguments for both petitioner and respondent based on these documents.'
                    : 'What are the strongest legal arguments on ';
                break;
        }
        setMessage(prompt);
        textareaRef.current?.focus();
    };

    return (
        <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Ask about selected documents or research sources..."}
                        className="min-h-[60px] max-h-[200px] pr-12 resize-none"
                        disabled={isLoading}
                    />

                    {/* Plus button inside textarea */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 bottom-2 h-8 w-8 p-0"
                                disabled={isLoading}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handlePlusOption('precedents')}>
                                <span className="font-medium">Precedents</span>
                                <span className="ml-2 text-xs text-slate-500">Find similar cases</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePlusOption('summary')}>
                                <span className="font-medium">Summary</span>
                                <span className="ml-2 text-xs text-slate-500">Summarize content</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePlusOption('arguments')}>
                                <span className="font-medium">Suggest Arguments</span>
                                <span className="ml-2 text-xs text-slate-500">Generate arguments</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="h-[60px] px-6"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5 mr-2" />
                            Send
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
