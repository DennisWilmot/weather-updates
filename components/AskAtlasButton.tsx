"use client";

import { Bot, Sparkles } from "lucide-react";

interface AskAtlasButtonProps {
    onClick: () => void;
    className?: string;
}

export default function AskAtlasButton({ onClick, className = "" }: AskAtlasButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`relative inline-flex mr-6 items-center gap-2 px-3 pl-5 py-1 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-sm shadow-lg hover:shadow-xl transition-all duration-300 group transform ${className}`}
            title="Ask Atlas - Your AI Assistant"
        >
            <div className="relative">
                {/* Animated sparkle */}
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-white  transition-all duration-300 animate-pulse" />
            </div>
            <span className="text-sm sm:inline bg-gradient-to-r from-white to-blue-50 bg-clip-text text-transparent font-bold">
                Ask Atlas
            </span>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 -z-10" />

            {/* Shine effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
        </button>
    );
}
