"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        async function logout() {
            try {
                // Call Better Auth built-in sign-out API
                await fetch("/api/auth/sign-out", {
                    method: "POST",
                });

                // Clear the better-auth cookie manually (extra safety)
                document.cookie =
                    "better-auth.session_token=; path=/; max-age=0; secure; samesite=lax";

                // Redirect to login page
                router.push("/auth");
            } catch (err) {
                console.error("Logout failed:", err);
                router.push("/auth");
            }
        }

        logout();
    }, [router]);

    return <p style={{ padding: 20 }}>Logging out...</p>;
}
