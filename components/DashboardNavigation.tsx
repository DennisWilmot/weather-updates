"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardNavigation() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const tabs = [
        { name: "Dashboard", href: "/" },
        { name: "Asset Matching", href: "/supervisor/maps" },
        { name: "Aid Forms", href: "/portal" },
        { name: "Data View ", href: "/sa" },
        // { name: "Settings", href: "/dashboard/settings" },
    ];

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo (always visible) */}
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/intellibusLgo.png"
                            alt="Atlas.TM"
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                        <span className="text-lg font-bold text-gray-900 hidden sm:block">
                            Atlas.TM
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:space-x-8 md:items-center">
                        {tabs.map((tab) => {
                            const active = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${active
                                        ? "border-blue-500 text-gray-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            {!mobileMenuOpen ? (
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="pt-2 pb-3 space-y-1">
                        {tabs.map((tab) => {
                            const active = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${active
                                        ? "bg-blue-50 border-blue-500 text-blue-700"
                                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                                        }`}
                                >
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
