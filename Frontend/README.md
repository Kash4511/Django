# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## API Resilience

The lead magnet generation system includes robust resilience features to handle malformed AI responses and API instability.

### Backend Resilience (Perplexity API)
The `PerplexityClient` in `Backend/lead_magnets/perplexity_client.py` implements:
- **Exponential Backoff Retries**: Automatically retries up to 3 times (configurable via `AI_MAX_RETRIES` environment variable) on JSON parsing failures or API errors.
- **Robust JSON Repair**: A multi-stage regex-based repair mechanism that fixes common AI hallucinations:
    - Missing commas between key-value pairs.
    - Unescaped quotes within JSON strings.
    - Unescaped control characters/newlines.
    - Single quotes used for keys or string boundaries.
    - Trailing commas in objects or arrays.
    - Unbalanced braces or brackets.
- **Debug Logging**: On any parsing failure, the first 5KB of the raw response is logged to standard output for easier diagnosis of new edge cases.

### Frontend Resilience
The `dashboardApi` in `Frontend/src/lib/dashboardApi.ts` includes:
- **`parseJSON` Helper**: A robust JSON parsing utility that sanitizes common malformations (trailing commas, control characters) before parsing.
- **Aggressive Repair**: Attempts to fix single-quote/double-quote mismatches if standard parsing fails.
- **Safe Error Handling**: Prevents unhandled exceptions in the browser console by gracefully handling invalid PDF/JSON responses from the generation endpoint.

### Configuration
- `AI_MAX_RETRIES`: (Default: 3) Set this in your `.env` file to control the number of retry attempts for AI generation.
- Debug logging is enabled by default for parsing failures.

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
