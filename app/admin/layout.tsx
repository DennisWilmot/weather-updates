"use client";

import AdminNavigation from "./nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <AdminNavigation />
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
