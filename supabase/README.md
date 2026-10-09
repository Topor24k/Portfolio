# Supabase backend

The portfolio reads its projects from Supabase, and you manage them in a private studio at **`/admin`** (not linked anywhere on the site).

- Visitors can only **read** published projects.
- Only `kayeencampana@gmail.com`, once its email is confirmed, can add, edit, delete or upload.
- Until the database is set up (or if it's ever unreachable), the site falls back to the projects bundled in `src/projects.js`, so it never shows an empty page.

## One-time setup

### 1. Create the tables, security rules and image bucket

**Option A — Dashboard (easiest):** open the [SQL editor](https://supabase.com/dashboard/project/sblysqqrezhzrimtpngy/sql/new), paste the contents of `migrations/20261009000000_portfolio_projects.sql`, and click **Run**.

**Option B — CLI:**

```bash
npx supabase login
npx supabase link --project-ref sblysqqrezhzrimtpngy
npx supabase db push
```

### 2. Create your owner account

Supabase dashboard → **Authentication → Users → Add user → Create new user**: enter your email and a password, and tick **Auto Confirm User**.

Then turn off public sign-ups: **Authentication → Sign In / Providers → Allow new users to sign up = off**. That way nobody else can register.

### 3. (Optional) Enable "Email me a link"

**Authentication → URL Configuration → Redirect URLs**: add `http://localhost:5173/admin` and your live URL followed by `/admin`.

### 4. Add the keys to Vercel

**Vercel → Project → Settings → Environment Variables**: add the same two variables that are in `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Then redeploy.

### 5. Move your existing projects into Supabase

Restart the dev server so `.env.local` loads, open `/admin`, sign in, and click **Import projects**. This uploads every cover, gallery and team photo to the `portfolio` storage bucket and creates editable records.

## Day to day

At `/admin` you can:

- **New project** — name, type, category, description, two overview paragraphs, disciplines, link, cover image, gallery (drag & drop, captions, reorder, set as cover) and team credits.
- **Live / Hidden** — show or hide a project without deleting it.
- **↑ / ↓** — change the order used on the home reel and the projects page.
- **Edit → Delete** — delete a project. Its images stay in storage.

The site caches the last list it loaded. Visitors see changes on their next visit.

## Security notes

- The publishable key is meant to be public; the security rules in the SQL are what protect your data.
- Never put the secret/service-role key or the database password in this repo or in any `VITE_` variable.
