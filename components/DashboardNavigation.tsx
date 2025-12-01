"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { usePermissions, useUser } from "../hooks/usePermissions";
import type { Permission } from "../lib/permissions";
import { Skeleton } from "@mantine/core";
import AskAtlasButton from "./AskAtlasButton";
import AskAtlasPanel from "./AskAtlasPanel";
import { updateLastActive } from "../lib/update-last-active-client";

interface NavigationItem {
    name: string;
    href: string;
    requiredPermissions?: Permission[];
    requireAll?: boolean; // If true, user needs ALL permissions; if false, user needs ANY permission
    adminOnly?: boolean; // Shortcut for admin-only items
    alwaysShow?: boolean; // Always show regardless of permissions (like Dashboard, Logout)
}

export default function DashboardNavigation() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [askAtlasOpen, setAskAtlasOpen] = useState(false);
    const { hasPermission, role, isLoading } = usePermissions();
    const { isAuthenticated } = useUser();

    // Update last active when user navigates (authenticated users only)
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            updateLastActive();
        }
    }, [pathname, isAuthenticated, isLoading]);

    // Define navigation items with their required permissions
    const allTabs: NavigationItem[] = [
        {
            name: "Dashboard",
            href: "/",
            alwaysShow: true
        },
        // {
        //     name: "Manage Forms",
        //     href: "/manage-forms",
        //     requiredPermissions: [
        //         "forms_create_templates",
        //         "forms_edit_templates",
        //         "forms_delete_templates",
        //         "forms_assign",
        //         "forms_publish",
        //         "forms_unpublish",
        //     ],
        //     requireAll: false // User needs ANY of these permissions
        // },
        {
            name: "Forms",
            href: "/forms",
            requiredPermissions: [
                "forms_view",
                "forms_view_submissions",
                "form_damage_assessment",
                "form_supply_verification",
                "form_shelter_survey",
                "form_medical_intake",
                "form_water_quality",
                "form_infrastructure_assessment",
                "form_emergency_contact",
                "form_resource_request",
                "form_people_needs"
            ],
            requireAll: false // User needs ANY of these permissions
        },
        {
            name: "Insights",
            href: "/insights",
            requiredPermissions: [
                "insights_view_dashboards",
                "insights_view_reports",
                "insights_create_custom_reports",
                "insights_export_data",
                "insights_generate_analytics",
                "insights_view_trends"
            ],
            requireAll: false // User needs ANY of these permissions
        },
        {
            name: "Admin Panel",
            href: "/admin",
            requiredPermissions: [
                "users_view_directory",
                "users_manage_permissions",
                "roles_view_all",
                "system_access_settings"
            ],
            requireAll: true // User needs ANY admin permission
        },
        {
            name: "Logout",
            href: "/logout",
            alwaysShow: true
        },
    ];

    // Filter tabs based on user permissions
    const tabs = useMemo(() => {
        if (!isAuthenticated) {
            // Show only public items when not authenticated
            return allTabs.filter(tab => tab.alwaysShow && (tab.name === "Dashboard" || tab.name === "Logout"));
        }

        // If authenticated but still loading permissions, show all tabs
        // They'll be filtered properly once permissions load
        if (isLoading) {
            return allTabs;
        }

        return allTabs.filter(tab => {
            // Always show items marked as alwaysShow
            if (tab.alwaysShow) return true;

            // Admin-only items
            if (tab.adminOnly && role !== 'admin') return false;

            // Check permissions
            if (tab.requiredPermissions && tab.requiredPermissions.length > 0) {
                return hasPermission(tab.requiredPermissions, tab.requireAll || false);
            }

            // Default: show the item
            return true;
        });
    }, [isAuthenticated, isLoading, role, hasPermission, allTabs]);

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
                        <div className="hidden sm:block">
                            <span className="text-lg font-bold text-gray-900">
                                Atlas.TM
                            </span>
                            {/* Show role badge next to logo for authenticated users */}
                            {isAuthenticated && role && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                    <span className="capitalize">{role}</span> Portal
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:space-x-8 md:items-center">
                        {/* Ask Atlas Button - Desktop */}
                        {isAuthenticated && (
                            <AskAtlasButton
                                onClick={() => setAskAtlasOpen(true)}
                                className="ml-4"
                            />
                        )}

                        {/* Navigation Links - Always show, async loading */}
                        {tabs.map((tab) => {
                            const active = pathname === tab.href;
                            const isPermissionProtected = tab.requiredPermissions && tab.requiredPermissions.length > 0;
                            const showLoadingState = isLoading && isAuthenticated && isPermissionProtected;

                            return (
                                <Link
                                    key={tab.href}
                                    prefetch
                                    href={tab.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${active
                                        ? "border-blue-500 text-gray-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        } ${showLoadingState ? "opacity-60" : "opacity-100"}`}
                                >
                                    {tab.name}
                                    {/* Show subtle loading indicator for permission-protected tabs */}
                                    {showLoadingState && (
                                        <div className="ml-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    )}
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
                        {/* Mobile Navigation Links - Always show, async loading */}
                        {tabs.map((tab) => {
                            const active = pathname === tab.href;
                            const isPermissionProtected = tab.requiredPermissions && tab.requiredPermissions.length > 0;
                            const showLoadingState = isLoading && isAuthenticated && isPermissionProtected;

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-200 ${active
                                        ? "bg-blue-50 border-blue-500 text-blue-700"
                                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                                        } ${showLoadingState ? "opacity-60" : "opacity-100"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{tab.name}</span>
                                        {/* Show subtle loading indicator for permission-protected tabs */}
                                        {showLoadingState && (
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Ask Atlas Button - Mobile */}
                        {isAuthenticated && (
                            <div className="pl-1 pr-2 py-1 border-t border-gray-200 mt-2">
                                <AskAtlasButton
                                    onClick={() => {
                                        setAskAtlasOpen(true);
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full justify-center"
                                />
                            </div>
                        )}

                        {/* Show user role info in mobile menu */}
                        {isAuthenticated && role && (
                            <div className="pl-3 pr-4 py-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                    Logged in as: <span className="font-medium capitalize text-gray-700">{role}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ask Atlas Panel */}
            <AskAtlasPanel
                isOpen={askAtlasOpen}
                onClose={() => setAskAtlasOpen(false)}
            />
        </nav>
    );
}

// Desktop Navigation Skeleton Loader
function NavigationSkeleton() {
    return (
        <div className="flex space-x-8 items-center">
            {/* Simulate 4-5 navigation items */}
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center">
                    <Skeleton height={20} width={Math.random() * 40 + 60} radius="sm" />
                </div>
            ))}
        </div>
    );
}

// Mobile Navigation Skeleton Loader
function MobileNavigationSkeleton() {
    return (
        <div className="space-y-1">
            {/* Simulate 4-5 mobile navigation items */}
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="pl-3 pr-4 py-2">
                    <Skeleton height={16} width={Math.random() * 60 + 80} radius="sm" />
                </div>
            ))}

            {/* User info skeleton */}
            <div className="pl-3 pr-4 py-2 mt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                    <Skeleton height={32} width={32} radius="xl" />
                    <div className="flex-1">
                        <Skeleton height={14} width={100} radius="sm" mb={4} />
                        <Skeleton height={12} width={80} radius="sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
