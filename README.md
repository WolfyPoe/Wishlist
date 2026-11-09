# Trevor & Maya's Wishlists

A tiny website hosted free on GitHub Pages. Items and claims live in a free Supabase database, so you and Maya add things from your phones and never touch code.

## Files

| File | What it is | Edit it? |
|---|---|---|
| `data.js` | Names, birthdays, photos, sizes, and your Supabase keys | Yes, once during setup |
| `supabase-setup.sql` | Creates the database tables | Paste into Supabase once |
| `index.html`, `styles.css`, `app.js` | The site itself | No |
| `images/` | Put `trevor.jpg` and `maya.jpg` here | Add photos |

Link straight to a list with `#trevor` or `#maya` at the end of the URL.

---

## Part 1: Put the site online (GitHub Pages)

1. Sign in at github.com (or make a free account).
2. Top right **+** → **New repository**. Name it `wishlist`, choose **Public**, click **Create repository**.
3. Click **uploading an existing file**. Drag in `index.html`, `styles.css`, `app.js`, `data.js` and the `images` folder. Click **Commit changes**.
4. **Settings → Pages**. Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → **Save**.
5. After about a minute, refresh. Your link shows at the top: `https://YOUR-USERNAME.github.io/wishlist/`

Until Part 2 is done, the site shows demo cards.

## Part 2: Connect Supabase

1. Make a free account at supabase.com → **New project**. Any name; save the database password somewhere.
2. **SQL Editor → New query.** Open `supabase-setup.sql`, change the two emails at the bottom to yours and Maya's (lowercase), paste it all in, click **Run**.
3. **Authentication → Users → Add user → Send invitation**. Do it once for your email and once for Maya's. (Only invited people can sign in.)
4. **Authentication → URL Configuration**:
   - Site URL: `https://YOUR-USERNAME.github.io/wishlist/`
   - Redirect URLs → **Add URL**: `https://YOUR-USERNAME.github.io/wishlist/**`
5. **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
6. On GitHub, open `data.js` → pencil icon → paste them into `url` and `anonKey` at the bottom → **Commit changes**.

The anon key is designed to be public. The database rules only let you edit your list and Maya edit hers.

## Adding things from your phone

1. Open the site → scroll to the bottom → **Edit my list**.
2. Enter your email → **Send link** → open the email on your phone and tap the link. You stay signed in on that phone.
3. Tap **+ Add item**. Tip: in the Amazon app tap **Share → Copy link** and paste it into Link.
4. Each card on your list now has **Edit** and **Delete**. Turn on **Most wanted** to pin something to the top.

## Changing names, birthdays, photos, sizes

Upload photos into `images/` on GitHub, then edit `data.js` (pencil icon) → set `photo: "images/trevor.jpg"`, `birthday: "MM-DD"`, etc. → **Commit changes**.
