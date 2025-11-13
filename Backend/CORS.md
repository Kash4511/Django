# CORS Configuration – Django Backend

This project uses `django-cors-headers` to enable secure cross-origin requests from the Vercel frontend to the Render-hosted backend.

## Middleware Setup

- `corsheaders.middleware.CorsMiddleware` is added at the top of `MIDDLEWARE` in `django_project/settings.py`.

## Key Settings

- `CORS_ALLOW_CREDENTIALS = True` – allows cookies/authorization with cross-origin requests (safe with JWT).
- `CORS_ALLOW_ALL_ORIGINS` – env-driven, default `false`. Set to `true` for local troubleshooting.
- `CORS_ALLOWED_ORIGINS` – explicit allowlist, includes `https://django-six-gamma.vercel.app` and local dev origins.
- `CORS_ALLOWED_ORIGIN_REGEXES = [^https://.*\.vercel\.app$]` – supports Vercel preview deployments.
- `CORS_URLS_REGEX = r"^/api/.*$"` – limits CORS handling to API requests.
- `CORS_PREFLIGHT_MAX_AGE = 600` – caches `OPTIONS` preflight responses for 10 minutes.
- `CORS_ALLOW_METHODS` – `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- `CSRF_TRUSTED_ORIGINS` – includes both Render backend and Vercel frontend domains.

## Preflight Handling

- DRF `APIView` has `options()` by default, but we provide an explicit `options()` handler on `FormaAIConversationView` to guarantee a 200 response.
- `django-cors-headers` automatically injects `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, and `Access-Control-Allow-Methods` in preflight responses.

## Environment Variables

- `CORS_ALLOW_ALL_ORIGINS` – set `true` in dev only if needed.
- `CORS_PREFLIGHT_MAX_AGE` – optional override of default `600` seconds.

## Troubleshooting

- If you see `No 'Access-Control-Allow-Origin' header`: confirm the request hits `/api/*` routes and that your Vercel domain is in `CORS_ALLOWED_ORIGINS` or matches the regex.
- If preflight is blocked: ensure the endpoint returns `200` to `OPTIONS` and that required headers (`Authorization`, `Content-Type`) are in `CORS_ALLOW_HEADERS`.
- For 401 Unauthorized: verify JWT storage and token refresh; login endpoint must set tokens correctly.
- Preview domains: if using a custom Vercel domain, update `CORS_ALLOWED_ORIGINS` or adjust the regex.

## Performance Notes

- Preflight caching reduces server load. Avoid setting an excessively low `CORS_PREFLIGHT_MAX_AGE`.

## Validation Checklist

- From `https://django-six-gamma.vercel.app`, send a POST to `/api/ai-conversation/` and confirm success.
- Test GET endpoints (e.g., `/api/templates/`) and POST endpoints (`/api/generate-pdf/`).
- Confirm 401 behavior when not logged in.
- Review browser devtools network panel for `OPTIONS` → `200` and expected CORS headers.