# ServerTemplate

A **TypeScript microservice boilerplate** using Express

______________________________________________________________________

## 🚀 Features

- **TypeScript** – full type safety across your codebase
- **Express** – lightweight, fast HTTP framework
- **Cors and Helmet** - middlewares for better compatibility and security
- **Zod** – runtime schema validation for request inputs / outputs
- **Custom NPM packages** – set up to share/common logic across microservices
- **Well-structured project** – modular folder layout (routes, controllers, services, etc.)
- **Testing** – using Vitest, along with a coverage command
- **CI/CD** - build, test and publish workflows with Github Actions
- **Bruno** - API client with local requests for manual testing
- **Docker support** – Dockerfile provided to containerize your microservice
- **Dev tooling** – Devbox custom init hooks and scripts, linting and hot reload

______________________________________________________________________

## 📁 Project Structure

Here is a high-level overview of the structure:

<pre>
ServerTemplate
    ├─ .github/workflows
    │    ├─ build-test.yml
    │    ├─ main.yml 
    │    └─ publish.yml
    ├── src
    │   ├── app.ts
    │   ├── index.ts
    │   ├── controllers/
    │   ├── routes/
    │   ├── schemas/
    │   ├── services/
    │   └── types/
    ├── tests/
    ├── bruno/
    ├── Dockerfile
    ├── eslint.config.js
    ├── package.json
    ├── tsconfig.json
    └── vitest.config.js
</pre>

## 📜 Commands

### Devbox

```sh
devbox bruno
devbox template:fetch
devbox docker:build
devbox docker:pull
devbox docker:run
devbox docker:run
devbox docker:stop 
```

### pnpm

```sh
pnpm run build
pnpm run prestart
pnpm run start
pnpm run dev
pnpm run test
pnpm run test:ui
pnpm run test:coverage
pnpm run lint
pnpm run lint:fix
```
