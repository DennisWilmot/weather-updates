'use client'
import { ChevronLeft, ChevronRight, Download, Search, X } from 'lucide-react';
import React, { useState } from 'react'

interface AuditLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
    ipAddress: string;
    device: string;
    beforeValue?: string;
    afterValue?: string;
}

const mockAuditLogs: AuditLog[] = [
    { id: '1', action: 'User Login', user: 'John Doe', timestamp: '2025-11-19 10:30:15', details: 'Successful login', ipAddress: '192.168.1.1', device: 'Chrome on Windows' },
    { id: '2', action: 'User Updated', user: 'Admin', timestamp: '2025-11-19 09:15:22', details: 'Updated user role', ipAddress: '192.168.1.5', device: 'Firefox on Mac', beforeValue: 'Editor', afterValue: 'Admin' },
    { id: '3', action: 'User Suspended', user: 'Admin', timestamp: '2025-11-18 16:45:10', details: 'Suspended user account', ipAddress: '192.168.1.5', device: 'Chrome on Windows' },
];

export default function Audits() {
    const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState('all');
    const [auditPage, setAuditPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showLogModal, setShowLogModal] = useState(false);

    // Audit log handlers
    const handleExportLogs = () => {
        const csv = 'Action,User,Timestamp,IP Address,Device\n' +
            filteredAuditLogs.map(log =>
                `${log.action},${log.user},${log.timestamp},${log.ipAddress},${log.device}`
            ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.csv';
        a.click();
    };

    const filteredAuditLogs = auditLogs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
            log.user.toLowerCase().includes(auditSearch.toLowerCase());
        const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
        return matchesSearch && matchesAction;
    });

    // Pagination
    const logsPerPage = 5;
    const paginatedLogs = filteredAuditLogs.slice((auditPage - 1) * logsPerPage, auditPage * logsPerPage);

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-4xl font-bold text-black bg-clip-text tracking-tight">Audit Logs</h1>
                <button
                    onClick={handleExportLogs}
                    className="flex items-center justify-center gap-2 bg-[#1a1a3c] text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
                >
                    <Download size={20} />
                    Export CSV
                </button>
            </div>

            {/* Search and filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={auditSearch}
                            onChange={(e) => setAuditSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        className="block w-48 px-3 py-2 text-sm border rounded-md bg-white shadow-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Actions</option>
                        <option value="User Login">User Login</option>
                        <option value="User Updated">User Updated</option>
                        <option value="User Suspended">User Suspended</option>
                    </select>

                </div>
            </div>

            {/* Audit logs - Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.map(log => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setShowLogModal(true);
                                    }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.details}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Desktop Pagination */}
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
                    <div className="text-sm text-gray-700">
                        Showing {((auditPage - 1) * logsPerPage) + 1} to {Math.min(auditPage * logsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length} logs
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                            disabled={auditPage === 1}
                            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setAuditPage(Math.min(Math.ceil(filteredAuditLogs.length / logsPerPage), auditPage + 1))}
                            disabled={auditPage >= Math.ceil(filteredAuditLogs.length / logsPerPage)}
                            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit logs - Mobile Cards */}
            <div className="lg:hidden space-y-4">
                {paginatedLogs.map(log => (
                    <div
                        key={log.id}
                        className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                            setSelectedLog(log);
                            setShowLogModal(true);
                        }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="font-semibold text-gray-900">{log.action}</div>
                            <div className="text-xs text-gray-500 ml-2 text-right">{log.timestamp}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">User:</span>
                                <span className="text-gray-900 font-medium">{log.user}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">IP:</span>
                                <span className="text-gray-900">{log.ipAddress}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <span className="text-gray-700">{log.details}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Mobile Pagination */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-gray-700 text-center sm:text-left">
                            Showing {((auditPage - 1) * logsPerPage) + 1} to {Math.min(auditPage * logsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                                disabled={auditPage === 1}
                                className="flex-1 sm:flex-none px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                <ChevronLeft size={16} />
                                <span className="sm:inline">Previous</span>
                            </button>
                            <button
                                onClick={() => setAuditPage(Math.min(Math.ceil(filteredAuditLogs.length / logsPerPage), auditPage + 1))}
                                disabled={auditPage >= Math.ceil(filteredAuditLogs.length / logsPerPage)}
                                className="flex-1 sm:flex-none px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                <span className="sm:inline">Next</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showLogModal && selectedLog && (
                <div className="fixed inset-0 bg-linear-to-br from-gray-900/80 via-gray-900/70 to-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        {/* Header with gradient */}
                        <div className="relative bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-8">
                            <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[20px_20px]"></div>
                            <div className="relative flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Audit Log Details</h2>
                                    <p className="text-blue-100 text-sm">Complete activity information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowLogModal(false);
                                        setSelectedLog(null);
                                    }}
                                    className="ml-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Primary Info Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Action</label>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{selectedLog.action}</p>
                                </div>
                                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <label className="text-xs font-semibold text-purple-900 uppercase tracking-wide">User</label>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{selectedLog.user}</p>
                                </div>
                            </div>

                            {/* Secondary Info */}
                            <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Timestamp</label>
                                    <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">{selectedLog.timestamp}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">IP Address</label>
                                        <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded-lg border border-gray-200 break-all">{selectedLog.ipAddress}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Device</label>
                                        <p className="text-gray-900 text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">{selectedLog.device}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                                <label className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-3  flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    Details
                                </label>
                                <p className="text-gray-900 leading-relaxed">{selectedLog.details}</p>
                            </div>

                            {/* Before/After Values */}
                            {selectedLog.beforeValue && selectedLog.afterValue && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-linear-to-br from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-200">
                                        <label className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3  flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Before Value
                                        </label>
                                        <p className="text-gray-900 font-medium bg-white/60 px-4 py-3 rounded-lg break-all">{selectedLog.beforeValue}</p>
                                    </div>
                                    <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                                        <label className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3  flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            After Value
                                        </label>
                                        <p className="text-gray-900 font-medium bg-white/60 px-4 py-3 rounded-lg break-all">{selectedLog.afterValue}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}