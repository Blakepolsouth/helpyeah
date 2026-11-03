# HelpYeah

Matches people with functional health practitioners (MDs/DOs, naturopaths, nutritionists/dietitians, health coaches) who can see them online in their state. Live at https://helpyeah.com

## Pages
- `/` — patient matcher: 5 questions → up to 3 matches → "See availability" goes to the practitioner's own booking page (via `/go/<id>`, which counts the click).
- `/join/` — practitioner application. New applications wait for your approval.
- `/admin/` — your private page: approve/verify practitioners, see demand by state and concern, waitlist (CSV), clicks sent per practitioner.

## One-time setup in Netlify
1. Site configuration → Environment variables → add `ADMIN_KEY` = a long password only you know (8+ characters). Redeploy.
2. Open https://helpyeah.com/admin/ and enter that key.

## Data
Stored in Netlify Blobs (no database to manage): `hy-listings` (practitioners) and `hy-events` (anonymous demand counts, clicks, waitlist emails).
No patient health records are stored. The quiz keeps only state, broad concern category and type of help, with no name or email unless the patient joins the waitlist.

## Before charging practitioners
Use a flat listing fee (like Psychology Today), not a per-patient fee, and have a healthcare attorney review it.
