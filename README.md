# StudyTrack — Gymnasium Learning Progress System

A mobile-first learning app for German Gymnasium students (Grades 5–13). Students track progress per learning item as **I know this**, **Kind of**, or **Don't know yet**.

## Demo mode (works out of the box)

The app runs in **demo mode** by default — no backend required. Sign up with any email + 6+ character password. All data (accounts, content, progress) is stored in the browser via `localStorage`.

**Try the demo flow:**
1. Create an account → pick a grade (7–9 have sample content)
2. Choose a subject → topic → mark items with ✅ / 🔶 / ❌
3. Open **My Progress** for the dashboard
4. Tap **Become Admin** → add subjects, topics, items, or bulk-import JSON

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Use these settings (already in `vercel.json`):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Deploy — demo mode works immediately with no env vars

## Production backend (optional)

To switch from demo mode to real Supabase auth + database:

1. Create a [Supabase](https://supabase.com) project
2. Add environment variables in Vercel (or `.env` locally):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the SQL schema in `supabase/schema.sql` in the Supabase SQL editor
4. Redeploy

## Local development

```bash
npm install
npm run web      # web preview at http://localhost:8081
npm run build    # static export to dist/ (same as Vercel)
```

## Content structure

| Level | Table / store key | Example |
|-------|-------------------|---------|
| Grade | `grades` | Grade 7 |
| Subject | `subjects` | Mathematics, German, Latin |
| Topic | `topics` | Fractions, Linear Equations |
| Item | `learning_items` | "1/2 = one half" |
| Progress | `progress` | know / kinda / dont per user |

Use the **Admin CMS** screen or bulk JSON import to add content without touching code.

## Tech stack

- Expo Router + React Native Web
- Supabase (optional, for production)
- Offline-first progress sync with local queue
