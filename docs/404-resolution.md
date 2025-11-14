# Forma AI 404 Resolution

This document summarizes the root cause and fixes applied to resolve 404 errors when navigating in the Forma AI app.

## Symptoms
- Navigating directly to routes like `/dashboard`, `/brand-assets`, or `/forma-ai` returned `404: NOT_FOUND` in production.
- Browser dev tools showed initial HTML load successful, but deep links and refreshes returned 404 and assets failed to resolve.

## Root Cause
1. Static hosting served the app without SPA rewrites, so client-side routes were not mapped to `index.html`.
2. Vite `base` was not configured for subpath deployments, causing built asset URLs to resolve incorrectly when hosted under a path (e.g., `/forma-ai`).
3. React Router used `BrowserRouter` without a `basename`, so client-side routing assumed root `/` instead of the configured base.

## Fixes Implemented
1. Vite base path
   - Updated `Frontend/vite.config.ts` to read `VITE_BASE_PATH` and set `base` accordingly. Default: `/`.
   - Added `preview.port` for local production-like testing.
2. React Router basename
   - Updated `Frontend/src/main.tsx` to use `<BrowserRouter basename={import.meta.env.BASE_URL}>`, aligning router with Vite `base`.
3. Hosting rewrites
   - Added `Frontend/vercel.json` with SPA rewrites: all paths route to `index.html` (except `/api/*`).
   - Added `Frontend/static.json` with similar rewrites for Render and other static hosts.

## Deployment Configuration
- Set `VITE_BASE_PATH` to the subpath if the app is deployed under one, e.g. `VITE_BASE_PATH=/forma-ai/`.
- Ensure `VITE_API_BASE_URL` is set at build time to the backend URL (e.g., `https://django-msvx.onrender.com`).

## Testing Checklist
1. Development
   - Run `npm run dev` and navigate to all routes; no 404s on refresh or direct links.
2. Production build preview
   - Run `npm run build && npm run preview` and test deep links; confirmed routes resolve.
3. Production hosting
   - Verify rewrites are applied. Deep-linking to `/dashboard` and `/brand-assets` returns the application shell.
4. API endpoints
   - Confirm `VITE_API_BASE_URL` points to the Django backend. Test `/api/auth/login/`, `/api/lead-magnets/`, `/api/preview-template/` responses.

## Preventing Recurrence
- Keep `vite.config.ts` base derived from env and router `basename` set from `import.meta.env.BASE_URL`.
- Maintain host-specific rewrite files (`vercel.json`, `static.json`) in repo and ensure they’re included in deployments.
- Document environment variables in deployment guides (`VITE_API_BASE_URL`, `VITE_BASE_PATH`).