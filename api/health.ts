/**
 * Vercel Serverless Function: /api/health
 * 
 * Instructions & Security Guidelines:
 * - Files in the /api directory run on Vercel's backend servers, NOT in the browser.
 * - Environment variables read here (e.g. process.env.MY_SECRET_KEY) are NEVER sent to the browser.
 * - Variables prefixed with VITE_ are inlined into the browser bundle during build and are public,
 *   so server-side secret keys must NOT use the VITE_ prefix.
 */

export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    time: new Date().toISOString()
  });
}
