# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
 ])
```

## Image Uploads & PDF Rendering

- Supported formats: `JPG`, `PNG`, `GIF`, `SVG` (up to `10MB` each).
- Upload UI enforces type and size with clear error messages on rejection.
- A server-rendered HTML preview is available before generating the PDF; it uses the selected template and your uploaded images.
- Aspect ratio is preserved in both preview and PDF using `object-fit: contain` to avoid cropping.
- For best quality:
  - Use images at least `1500px` wide for full-width slots.
  - Prefer `PNG` for graphics and `JPG` for photos; use `SVG` for vector logos and line art.
  - Animated `GIF` frames are not animated in PDFs (first frame rendered).
  - Ensure images are under `10MB`; very large SVGs with embedded bitmaps may be slow.

### Known Limitations

- PDFs do not support animation; `GIF` renders as a static image.
- Extremely large `SVG` files may impact rendering performance.
- Images are embedded as data URLs; if you see a broken image, recheck file type/size and retry.

## CORS & Error Handling

- Set `VITE_API_BASE_URL` to your backend, e.g., `https://django-msvx.onrender.com`.
- Development runs on `http://localhost:5173`.
- Requests use an Axios client with JWT in `Authorization: Bearer <token>`.
- For file uploads, do not set `Content-Type` manually; the browser adds the multipart boundary.
- The `FormaAI` component includes retry/backoff for transient preflight/network issues and user-friendly messages for 401/403/CORS blocks.

### Troubleshooting

- If a message suggests a CORS issue, refresh and retry.
- Ensure the backend has your Vercel domain in `CORS_ALLOWED_ORIGINS` or matches the preview regex.
- Verify you are logged in; unauthorized requests return 401.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
