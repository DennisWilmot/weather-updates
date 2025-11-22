"use client";

import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Link as LinkIcon,
    Users,
    Box,
    MapPin,
    Zap,
} from "lucide-react";

interface MatchNode {
    id: string;
    type: "person" | "asset" | "place";
    name: string;
    latitude: number;
    longitude: number
}

interface MatchChain {
    id: string;
    nodes: MatchNode[];
}

// Dummy data
const dummyMatches: MatchChain[] = [
    {
        id: "match-1",
        nodes: [
            { id: "p1", type: "person", name: "Jason", latitude: 18.2281, longitude: -78.1292 },
            { id: "a1", type: "asset", name: "iPhone Unit 3", latitude: 18.2266, longitude: -78.1312 },
            { id: "p2", type: "person", name: "Kerish", latitude: 18.2267, longitude: -78.1306 }
        ]
    },
    {
        id: "match-2",
        nodes: [
            { id: "p3", type: "person", name: "Nurse Adams", latitude: 18.2302, longitude: -78.1251 },
            { id: "a2", type: "asset", name: "Medical Kit", latitude: 18.2294, longitude: -78.1267 },
            { id: "p4", type: "person", name: "Civilian #2301", latitude: 18.2278, longitude: -78.1290 }
        ]
    },
    {
        id: "match-3",
        nodes: [
            { id: "p5", type: "person", name: "Rescuer Leo", latitude: 18.2249, longitude: -78.1341 },
            { id: "a3", type: "asset", name: "Drone Unit A", latitude: 18.2253, longitude: -78.1330 },
            { id: "pl1", type: "place", name: "Survey Team HQ", latitude: 18.2260, longitude: -78.1322 }
        ]
    }
];


export default function AIMatchingPanel({ onMatchClick }: any) {
    const [page, setPage] = useState(0);

    const pageSize = 3;
    const totalPages = Math.ceil(dummyMatches.length / pageSize);

    const getNodeIcon = (type: MatchNode["type"]) => {
        switch (type) {
            case "person":
                return <Users size={18} className="text-blue-600" />;
            case "asset":
                return <Box size={18} className="text-teal-600" />;
            case "place":
                return <MapPin size={18} className="text-purple-600" />;
        }
    };

    const pageMatches = dummyMatches.slice(
        page * pageSize,
        page * pageSize + pageSize
    );

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Zap size={22} className="text-blue-600" />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        AI Matching System
                    </h3>
                    <p className="text-sm text-gray-500">
                        Smart mission-to-resource connections
                    </p>
                </div>
            </div>

            {/* MATCHES LIST */}
            <div className="space-y-4">
                {pageMatches.map((match) => (
                    <div
                        onClick={() => onMatchClick(match)}
                        key={match.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                        <div className="flex items-center justify-between">
                            {match.nodes.map((node, index) => (
                                <div key={node.id} className="flex items-center gap-2">
                                    {/* Node */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center">
                                            {getNodeIcon(node.type)}
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 mt-1 w-20 truncate">
                                            {node.name}
                                        </p>
                                    </div>

                                    {/* connector */}
                                    {index < match.nodes.length - 1 && (
                                        <LinkIcon size={18} className="text-gray-400 mx-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-center gap-3 mt-6">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={18} />
                </button>

                <span className="text-sm font-medium text-gray-700">
                    Page {page + 1} / {totalPages}
                </span>

                <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
