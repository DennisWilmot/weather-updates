"use client";

import SupervisorNavigation from "./nav";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <SupervisorNavigation />
            {children}
        </div>
    );
}
