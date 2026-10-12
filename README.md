# Salsey

Live AI copilot for sales calls: it listens on the call, flags objections the moment they land, and tells you what to say, grounded in your own offer and playbook.

- `app/`: Next.js web app (landing page, waitlist, dashboard, API routes). Deployed on Vercel.
- `extension/`: Chrome extension that shows the in-call overlay on Google Meet.
- `video/`: Remotion project that renders the landing-page hero video.

Secrets live in `app/.env.local` (not committed).
