# CLAUDE.md - Guide for AI Assistance

## Build, Lint & Test Commands

```bash
# Development
npm run dev                # Start development server
npm run build              # Build for production
npm run format             # Run Prettier + ESLint --fix

# Testing
npm run test               # Run all unit tests once
npm run test:e2e           # E2E tests
npm run test:unit          # Unit tests
```

## Code Style Guidelines

- **Component Naming**: PascalCase for all components (Button.svelte)
- **File Organization**: Features grouped in /lib/components and /lib/Pages
- **Styling**: TailwindCSS with utility classes
- **Types**: Use JSDoc for type documentation
- **Testing**: Use @testing-library/svelte for component testing
- **Error Handling**: Use try/catch with appropriate logging
- **Imports**: Group imports by external, then internal, then relative
- **Commit Style**: Conventional commits required (feat:, fix:, chore:)
- **Code Style**: Should use arrow functions

This SvelteKit project follows trunk-based development with squash merges to main.
