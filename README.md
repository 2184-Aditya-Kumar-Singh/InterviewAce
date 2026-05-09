# InterviewAce

Production-ready full-stack SaaS starter for AI mock interviews, optimized for zero-cost/free-tier deployment.

## Stack

- Next.js 16 + TypeScript + App Router
- Tailwind CSS 4
- Supabase free tier for PostgreSQL, Auth, and Storage
- Vercel free tier deployment
- Monaco editor for future Premium coding rounds
- Browser Text-to-Speech interviewer avatar with local SadTalker-style animation fallback
- Free Piston API proxy for Java, Python, C++, and C execution
- Optional OpenAI API integration with local mock fallback

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env.local
```

3. Add Supabase keys if you have them. Leave them blank for demo mode.

4. Run the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Supabase Setup

1. Create a free Supabase project.
2. Open SQL Editor and run `supabase/migrations/001_initial_schema.sql`.
3. Enable Google provider in Authentication > Providers.
4. Enable Email OTP/magic link in Authentication settings.
5. Add these redirect URLs in Authentication > URL Configuration:

```text
http://localhost:3000/auth/callback
https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback
```

6. Set the Site URL to your production Vercel URL after deployment.
7. Create a private Storage bucket named `resumes` if you want persisted resume files.
8. Add these variables to `.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
PISTON_API_URL=https://emkc.org/api/v2/piston/execute
PISTON_API_KEY=
```

Use either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or Supabase's newer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it in client code.
`PISTON_API_KEY` is optional for self-hosted Piston. The public EMKC endpoint may require authorization depending on current capacity and policy.

## Free Deployment Guide

### Vercel

1. Push this repository to GitHub.
2. Import it in Vercel.
3. Add environment variables from `.env.example`.
4. Deploy on the free Hobby plan.

### Supabase

Use the free tier for Auth, Postgres, and Storage. Keep uploaded files small and consider deleting old free-plan resumes with a scheduled cleanup later.

### Backend Cost

This app uses Next.js API routes, so Render is not required. If you later split to FastAPI, deploy the backend to Render free tier and update API URLs.

## Adding Paid Features Later

- Add Razorpay or Stripe Checkout.
- On successful payment, update `subscriptions.plan` to `PRO` or `PREMIUM`.
- Gate advanced voice interview, cross-question generation, AI code review, and company-specific rounds by plan.
- Replace the local avatar mouth animation with generated SadTalker videos for paid plans.
- Store payment events in `analytics_events`.
- Add server-side daily limit checks before creating interviews.

## Optional Enhancements

- Persist parsed resumes and interview reports from API routes using Supabase service role.
- Add speech-to-text answer recording for Pro.
- Add hidden test cases and AI code review for Premium.
- Host your own Piston instance if public free API limits become restrictive.
- Add admin-only RLS policies and a proper admin role guard.
- Add Playwright tests for the interview flow.
- Add background cleanup for old uploaded resumes to stay inside free-tier limits.
