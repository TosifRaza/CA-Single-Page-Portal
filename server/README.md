# CA-Platform-backend

Backend API for CA Platform using Express, TypeScript, Prisma, and MySQL.

## Run locally

Requirements: Node.js 20+, npm, and MySQL 8.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

On Windows, `npm run dev` starts local MySQL on port 3307 and synchronizes the Prisma schema before starting the API. Set `DATABASE_URL` in `.env` to use another MySQL server. The API listens on port 5001 by default.
