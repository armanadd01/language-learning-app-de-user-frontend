# Vercel Deployment (main-frontend-user-side)

## Project settings
- **Framework preset**: Next.js
- **Root Directory**: `main-frontend-user-side`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: (leave empty / default)

## Environment variables
Set these in Vercel (Project → Settings → Environment Variables):

- `NEXT_PUBLIC_API_BASE_URL`
  - Example: `https://YOUR-BACKEND-DOMAIN.com`

> Note: `NEXT_PUBLIC_*` variables are embedded into the frontend bundle and are visible in the browser.

## Notes
- This repo ignores `.env*` files for security.
- Commit `.env.example` as a template for required variables.
- If your backend uses cookies/auth, make sure your backend CORS allows your Vercel domain.
