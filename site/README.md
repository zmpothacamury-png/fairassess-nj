# FairAssess NJ website

Next.js (App Router) + Tailwind CSS. Deployed on Vercel, which builds only
this `site/` folder. The project overview, data download steps, and
pipeline commands are in the main [README](../README.md).

The site reads the JSON files in `public/data/`, which the Python pipeline
writes (never edit them by hand). Design tokens and components:
[docs/design-system.md](../docs/design-system.md). Page layouts:
[docs/site-format.md](../docs/site-format.md).

## Run it locally (Windows PowerShell)

```powershell
cd site
npm install
Copy-Item .env.local.example .env.local
# then open .env.local and paste in your Supabase URL and anon key
npm run dev
```

Open http://localhost:3000. Only the waitlist form needs Supabase. It shows
the generic error message until `.env.local` has real values in it.

Before saying a change is done, always run:

```powershell
npm run build
```

## Supabase setup checklist

Do these once, in order, in the Supabase and Vercel dashboards.

1. **Create the table.** In the Supabase dashboard, open your project, go
   to **SQL Editor > New query**, paste in the contents of
   `site/supabase/schema.sql`, and click **Run**. This creates the
   `waitlist` table (`id`, `email`, `source`, `created_at`) and turns on
   Row Level Security.

2. **Check the security policy.** The SQL script already adds a policy
   that lets the `anon` role only `INSERT` rows — no `SELECT`, `UPDATE`,
   or `DELETE`. You can see it under **Authentication > Policies >
   waitlist**. This is why it's safe to put the anon key in the browser:
   even if someone reads it out of your site's JavaScript, the database
   itself won't let them read, change, or delete anyone's email.

3. **Copy your API keys.** In the Supabase dashboard, go to **Project
   Settings > Data API** (sometimes labeled **API**):
   - Copy the **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy the **anon / public** key (not the `service_role` key) → this is
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. **Paste them into Vercel.** In your Vercel project, go to **Settings >
   Environment Variables** and add both:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Check the boxes for **Production**, **Preview**, and **Development**
   so the form works on every deployment.

5. **Check whether Vercel already did this for you.** If you installed
   the Supabase integration from the Vercel Marketplace, it may have
   auto-added these env vars (sometimes under different names, like
   `SUPABASE_URL` / `SUPABASE_ANON_KEY`, without the `NEXT_PUBLIC_`
   prefix). Don't assume — go look:
   - In Vercel: **Settings > Environment Variables** and check the exact
     names present. This site's code specifically reads
     `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If
     the integration used different names, either rename them or add the
     two names above pointing at the same values.

6. **Set up local dev.** Create `site/.env.local` (copy
   `.env.local.example`) with the same two values. `.env.local` is
   already listed in `.gitignore` — never commit it.

7. **Redeploy after any env var change.** Vercel does not apply new or
   changed environment variables to a deployment that's already running.
   After adding or editing one, trigger a new deploy (push a commit, or
   click **Redeploy** in the Vercel dashboard).

