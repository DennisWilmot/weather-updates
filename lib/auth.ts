import { betterAuth } from "better-auth";
import { db } from "./db";
import * as schema from "./db/schema";
import { Resend } from "resend";

// Only initialize Better Auth if required environment variables are set
// BETTER_AUTH_SECRET is required, Google OAuth is optional
const isBetterAuthConfigured = !!process.env.BETTER_AUTH_SECRET;
const hasGoogleOAuth = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

// Get base URL - use environment variable or detect from request
// For development, works with any localhost port (3000, 3001, 3002, etc.)
const getBaseURL = (request?: Request) => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://atlas.tm";
  }

  // In development, try to detect from request headers if available
  if (request) {
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // Fallback: use localhost:3000 (client-side will use window.location.origin anyway)
  return "http://localhost:3000";
};

// Import drizzle adapter for Better Auth
// Better Auth v1.3+ includes drizzle adapter
// Use package import path which works in both dev and serverless (Vercel) environments
let drizzleAdapter: any = null;
if (typeof window === "undefined" && isBetterAuthConfigured) {
  try {
    // Use package import path - this works in Vercel/serverless environments
    // The package.json exports should handle the path resolution
    const adapterModule = require("better-auth/adapters/drizzle");
    drizzleAdapter = adapterModule.drizzleAdapter; // This is the correct export name

    if (!drizzleAdapter || typeof drizzleAdapter !== "function") {
      console.warn(
        "[Better Auth] Drizzle adapter not found, using memory adapter"
      );
      drizzleAdapter = null;
    } else {
      console.log("[Better Auth] Drizzle adapter loaded successfully");
    }
  } catch (e: any) {
    console.error("[Better Auth] Error loading drizzle adapter:", e.message);
    if (process.env.NODE_ENV === "development") {
      console.error("[Better Auth] Stack:", e.stack);
    }
    console.warn(
      "[Better Auth] Falling back to memory adapter (data will not persist)"
    );
    drizzleAdapter = null;
  }
}

// Create auth instance factory that can use request-specific baseURL
const createAuthInstance = (request?: Request) => {
  const baseURL = getBaseURL(request);
  const resend = new Resend(process.env.RESEND_API_TOKEN);

  // Determine trusted origins based on environment
  const trustedOrigins =
    process.env.NODE_ENV === "production"
      ? ["https://atlas.tm", "https://www.atlas.tm"]
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
        ];

  if (isBetterAuthConfigured && drizzleAdapter) {
    return betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      emailAndPassword: {
        enabled: true,
        resetPasswordEnabled: true,
        sendResetPassword: async ({ user, url }) => {
          // Send email with reset link
          // url contains the reset token
          console.log(`Password reset for ${user.email}: ${url}`);

          // TODO: Implement your email sending logic here
          // Examples: Resend, SendGrid, Nodemailer, etc.
          await resend.emails.send({
            to: user.email,
            from: "onboarding@resend.dev",
            subject: "Reset Your Password",
            html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  .container {
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 40px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                  }
                  .logo {
                    width: 64px;
                    height: 64px;
                    background-color: #1a1a3c;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                  }
                  h1 {
                    color: #1a1a3c;
                    margin: 0 0 10px 0;
                    font-size: 24px;
                  }
                  .button {
                    display: inline-block;
                    background-color: #1a1a3c;
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 14px 32px;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: 600;
                  }
                  .button:hover {
                    background-color: #2d2d5f;
                  }
                  .info {
                    background-color: #f3f4f6;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 20px;
                    font-size: 14px;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 14px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <h1>Reset Your Password</h1>
                    <p style="color: #6b7280; margin: 0;">
                      We received a request to reset your password for your Intellibus account.
                    </p>
                  </div>

                  <div style="text-align: center;">
                    <p>Click the button below to reset your password:</p>
                    <a href="${url}" class="button">Reset Password</a>
                  </div>

                  <div class="info">
                    <p style="margin: 0 0 10px 0;"><strong>Security tips:</strong></p>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>This link will expire in 1 hour</li>
                      <li>If you didn't request this reset, you can safely ignore this email</li>
                      <li>Never share this link with anyone</li>
                    </ul>
                  </div>

                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Intellibus. All rights reserved.</p>
                    <p style="margin-top: 10px;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${url}" style="color: #1a1a3c; word-break: break-all;">${url}</a>
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
          });
        },
      },
      ...(hasGoogleOAuth && {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        },
      }),
      baseURL,
      secret: process.env.BETTER_AUTH_SECRET!,
      trustedOrigins,
    });
  }

  // Fallback: create a minimal auth instance that won't crash
  return betterAuth({
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        // Send email with reset link
        // url contains the reset token
        console.log(`Password reset for ${user.email}: ${url}`);

        // TODO: Implement your email sending logic here
        // Examples: Resend, SendGrid, Nodemailer, etc.
        await resend.emails.send({
          to: user.email,
          from: "onboarding@resend.dev",
          subject: "Reset Your Password",
          html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 8px;
                  padding: 40px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  width: 64px;
                  height: 64px;
                  background-color: #1a1a3c;
                  border-radius: 50%;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 20px;
                }
                h1 {
                  color: #1a1a3c;
                  margin: 0 0 10px 0;
                  font-size: 24px;
                }
                .button {
                  display: inline-block;
                  background-color: #1a1a3c;
                  color: #ffffff !important;
                  text-decoration: none;
                  padding: 14px 32px;
                  border-radius: 6px;
                  margin: 20px 0;
                  font-weight: 600;
                }
                .button:hover {
                  background-color: #2d2d5f;
                }
                .info {
                  background-color: #f3f4f6;
                  padding: 15px;
                  border-radius: 6px;
                  margin-top: 20px;
                  font-size: 14px;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h1>Reset Your Password</h1>
                  <p style="color: #6b7280; margin: 0;">
                    We received a request to reset your password for your Intellibus account.
                  </p>
                </div>

                <div style="text-align: center;">
                  <p>Click the button below to reset your password:</p>
                  <a href="${url}" class="button">Reset Password</a>
                </div>

                <div class="info">
                  <p style="margin: 0 0 10px 0;"><strong>Security tips:</strong></p>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, you can safely ignore this email</li>
                    <li>Never share this link with anyone</li>
                  </ul>
                </div>

                <div class="footer">
                  <p>© ${new Date().getFullYear()} Intellibus. All rights reserved.</p>
                  <p style="margin-top: 10px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${url}" style="color: #1a1a3c; word-break: break-all;">${url}</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        });
      },
    },
    baseURL,
    secret:
      process.env.BETTER_AUTH_SECRET || "temporary-secret-change-in-production",
    trustedOrigins,
  });
};

// Default auth instance (used when request is not available)
export const auth = createAuthInstance();

// Export factory function for request-specific instances
export { createAuthInstance };
