# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AdonisJS 6 application - a TypeScript-first Node.js web framework built on top of the standard Node.js HTTP server. The project uses ESM (ECMAScript modules) and leverages modern TypeScript features.

## Development Commands

```bash
# Start development server with HMR (Hot Module Replacement)
npm run dev

# Start production server
npm start

# Run all tests with watcher
npm test

# Run tests once (use for CI or single test runs)
node ace test

# Run specific test suite
node ace test -- --suite=unit
node ace test -- --suite=functional

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# List all available ace commands
node ace list

# List application routes
node ace list:routes
```

## Architecture

### Application Structure

AdonisJS follows a convention-based structure:

- **`bin/`** - Entry points for the application
  - `server.ts` - HTTP server entry point
  - `console.ts` - Ace CLI entry point
  - `test.ts` - Test runner entry point

- **`start/`** - Bootstrap files that run on application start
  - `env.ts` - Environment validation schema
  - `routes.ts` - HTTP route definitions
  - `kernel.ts` - HTTP middleware registration

- **`app/`** - Application logic organized by feature type
  - `controllers/` - HTTP controllers
  - `middleware/` - HTTP middleware
  - `exceptions/` - Custom exception handlers
  - `models/` - Database models
  - `services/` - Business logic services
  - `validators/` - VineJS validation schemas
  - `listeners/` - Event listeners
  - `events/` - Event classes
  - `policies/` - Authorization policies
  - `mails/` - Email templates and logic

- **`config/`** - Configuration files for various packages
  - `app.ts` - HTTP server and app key configuration
  - `bodyparser.ts` - Request body parsing settings
  - `hash.ts` - Password hashing configuration
  - `logger.ts` - Logging configuration

- **`tests/`** - Test files organized by type
  - `unit/` - Unit tests (timeout: 2s)
  - `functional/` - Functional/integration tests (timeout: 30s)

### Import Aliases

The project uses TypeScript path aliases (configured in `package.json` imports field):

```typescript
import SomeController from '#controllers/some_controller'
import SomeMiddleware from '#middleware/some_middleware'
import SomeModel from '#models/some_model'
import SomeService from '#services/some_service'
import router from '#start/routes'
// etc.
```

All imports use `.js` extensions even in TypeScript files (ESM requirement).

### Ignitor Boot Process

AdonisJS uses the Ignitor class to bootstrap the application:

1. Environment variables are validated against the schema in `start/env.ts`
2. Service providers are loaded (defined in `adonisrc.ts`)
3. Preload files run (`start/routes.ts` and `start/kernel.ts`)
4. HTTP server starts or Ace command executes

### Middleware System

Two middleware stacks exist:

1. **Server middleware** - Runs on ALL HTTP requests (registered in `start/kernel.ts` via `server.use()`)
   - Example: `container_bindings_middleware` binds HttpContext and Logger to the DI container

2. **Router middleware** - Runs only on requests with registered routes (registered via `router.use()`)
   - Example: `bodyparser_middleware` parses request bodies

3. **Named middleware** - Explicitly assigned to routes/groups (defined in `start/kernel.ts` as `middleware` export)

### Error Handling

Global exception handling is configured via `server.errorHandler()` in `start/kernel.ts`, pointing to `app/exceptions/handler.ts`. The handler extends `ExceptionHandler` with two key methods:

- `handle()` - Converts exceptions to HTTP responses
- `report()` - Logs errors or sends to monitoring services

### Testing Setup

Tests use Japa test runner with AdonisJS plugin:

- Configuration in `tests/bootstrap.ts`
- Functional/e2e tests auto-start HTTP server
- Test suites defined in `adonisrc.ts` tests section
- Use `@japa/assert` for assertions

### Hot Module Replacement

Development server supports HMR for controllers and middleware (configured in `package.json` under `hotHook.boundaries`). Changes to these files reload without full server restart.

## Code Scaffolding

Use `node ace make:*` commands to generate boilerplate:

```bash
node ace make:controller UsersController
node ace make:middleware Auth
node ace make:service UserService
node ace make:validator CreateUserValidator
node ace make:test users/list
```

Generated files follow framework conventions and include proper import aliases.

## Environment Configuration

Required environment variables (validated in `start/env.ts`):

- `NODE_ENV` - Must be 'development', 'production', or 'test'
- `PORT` - HTTP server port (number)
- `APP_KEY` - Encryption key (generate with `node ace generate:key`)
- `HOST` - Server host (must be valid hostname)
- `LOG_LEVEL` - Logging level (string)

## Important Notes

- Always use import aliases (`#controllers/*`, `#models/*`, etc.) instead of relative paths
- All imports must include `.js` extension (ESM requirement)
- The application runs in ESM mode (`"type": "module"` in package.json)
- TypeScript is transpiled via ts-node-maintained in development
- Production builds compile TypeScript to JavaScript in the `build/` directory
- The Ace CLI (`node ace`) is the primary way to interact with the application
