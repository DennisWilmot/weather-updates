"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { X, Send, Sparkles, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AskAtlasPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const getSuggestionsForPage = () => {
    // Default suggestions for Atlas.TM platform
    return [
        {
            title: "Show me",
            label: "dashboard overview",
            action: "Give me an overview of the dashboard and key metrics"
        },
        {
            title: "Help with",
            label: "form management",
            action: "How do I create and manage forms in the system?"
        },
        {
            title: "Explain",
            label: "user permissions",
            action: "Explain how user roles and permissions work"
        },
        {
            title: "Show recent",
            label: "system activity",
            action: "Show me recent activity and updates in the system"
        }
    ];
};

const Thread = ({ suggestions }: { suggestions: any[] }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when component mounts
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            let assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('0:')) {
                            try {
                                const data = JSON.parse(line.slice(2));
                                if (data.type === 'text-delta' && data.textDelta) {
                                    assistantMessage.content += data.textDelta;
                                    setMessages(prev =>
                                        prev.map(msg =>
                                            msg.id === assistantMessage.id
                                                ? { ...msg, content: assistantMessage.content }
                                                : msg
                                        )
                                    );
                                }
                            } catch (e) {
                                // Ignore parsing errors for incomplete chunks
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as any);
        }
    };

    const handleSuggestionClick = (action: string) => {
        setInput(action);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 mx-auto">
                                <Sparkles className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Hello!</h3>
                            <p className="text-gray-500 text-sm">How can I help you today?</p>
                        </div>
                        <div className="w-full max-w-md">
                            <div className="grid grid-cols-2 gap-3">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion.action)}
                                        className="text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">
                                                {suggestion.title}
                                            </div>
                                            <div className="text-gray-600 text-xs mt-1">
                                                {suggestion.label}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? "justify-end" : "justify-start"}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-gray-600" />
                            </div>
                        )}

                        <div className={`max-w-[80%] ${message.role === 'user' ? "order-first" : ""}`}>
                            <div
                                className={`p-3 rounded-lg ${message.role === 'user'
                                    ? "bg-blue-600 text-white ml-auto"
                                    : "bg-gray-100 text-gray-900"
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 px-1">
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {message.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-xs font-semibold text-white">U</span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                <form onSubmit={onSubmit} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Message Atlas..."
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder-gray-400"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        size="sm"
                        className="h-9 px-3"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default function AskAtlasPanel({ isOpen, onClose }: AskAtlasPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const suggestions = useMemo(() => getSuggestionsForPage(), []);

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleMinimize = () => {
        setIsExpanded(false);
    };

    const handleClose = () => {
        onClose();
        setIsExpanded(false);
    };

    // Render Thread content with stable key to help preserve identity
    const threadContent = (
        <div className="flex-1 overflow-hidden">
            <Thread key="atlas-chat-thread" suggestions={suggestions} />
        </div>
    );

    return (
        <>
            {/* Expanded View */}
            {isExpanded && isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col border bg-background">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h2 className="font-semibold text-lg">Ask Atlas</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleMinimize}
                                aria-label="Minimize"
                            >
                                <Minimize2 className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>
                    {threadContent}
                </div>
            )}

            {/* Minimized View (Sheet) */}
            {!isExpanded && (
                <Sheet open={isOpen} onOpenChange={onClose}>
                    <SheetContent
                        side="right"
                        className="flex w-full flex-col p-0 sm:max-w-lg [&>button]:hidden"
                    >
                        <SheetHeader className="border-b px-6 py-4">
                            <div className="flex items-center justify-between">
                                <SheetTitle className="font-semibold text-lg">
                                    Ask Atlas
                                </SheetTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleExpand}
                                        aria-label="Expand to full screen"
                                    >
                                        <Maximize2 className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClose}
                                        aria-label="Close"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </SheetHeader>
                        {threadContent}
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
}