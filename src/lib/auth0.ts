// lib/auth0.ts - Server-side Auth0 helpers for v3.8.0

import {
  getSession,
  getAccessToken,
  withApiAuthRequired,
  withPageAuthRequired,
} from "@auth0/nextjs-auth0";

// Export server-side helpers for use in server components and API routes
export {
  getSession,
  getAccessToken,
  withApiAuthRequired,
  withPageAuthRequired,
};

// For backward compatibility, create an auth0 object with getSession method
export const auth0 = {
  getSession: getSession,
};
