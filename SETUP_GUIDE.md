# TAC Training — Setup Guide

A beginner-friendly guide to get your workout tracker running as a real app on your iPhone. No coding knowledge required.

**Time needed:** about 15 minutes.
**Cost:** $0.
**What you'll end up with:** Your app at a URL like `tac-training.vercel.app`, plus an icon on your iPhone home screen that opens it full-screen like a native app, with your workout data saved forever on your device.

---

## The big picture (30 seconds of context)

You're going to do four things:

1. **Put the code on GitHub** — a free website where code lives.
2. **Connect GitHub to Vercel** — a free service that turns your code into a live website.
3. **Open the URL on your iPhone** and tap "Add to Home Screen."
4. **Done.** From now on, any workout you log stays on your phone between sessions.

You won't need to type any commands or install any software on your computer. We're doing everything through the browser.

---

## Step 1 — Create a GitHub account (2 min)

GitHub is like Google Drive for code.

1. Go to **[github.com](https://github.com)**.
2. Click **Sign up**. Use any email and pick a username.
3. Verify your email when they send the verification link.

That's it. You're in.

---

## Step 2 — Create a new repository (3 min)

A "repository" (or "repo") is just a folder for your project on GitHub.

1. Once logged in, click the **+** icon in the top-right of GitHub, then **New repository**.
2. **Repository name:** type `tac-training` (or anything you want — no spaces).
3. Leave it set to **Public**.
4. **Don't** check any of the "Initialize this repository with" boxes.
5. Click the green **Create repository** button at the bottom.

You'll land on an empty repo page. Keep this tab open — you'll need it in a minute.

---

## Step 3 — Upload the project files (3 min)

I've prepared a folder called `tac-app` for you with everything ready to go. You just need to upload it.

1. On your empty GitHub repo page, look for the link that says **"uploading an existing file"** (it's in the middle of the page, inside the setup instructions). Click it.
2. A screen will appear with a dashed box saying **"Drag files here to add them to your repository"**.
3. In the `tac-app` folder I'm sharing with you, select **all the files and folders inside it** (the `src` folder, the `public` folder, `package.json`, `vite.config.js`, `index.html`, `.gitignore`) and drag them into the dashed box on GitHub.
   - **Important:** upload the *contents* of `tac-app`, not the `tac-app` folder itself. Your repo should have `package.json` at its top level, not `tac-app/package.json`.
4. Wait for uploads to finish (usually 10–20 seconds).
5. Scroll down. In the box that says **"Commit changes"**, just click the green **Commit changes** button. Ignore the text fields — the defaults are fine.

Your GitHub repo now has all the code.

---

## Step 4 — Deploy with Vercel (4 min)

Vercel turns your code into a live website. Free for personal use.

1. Go to **[vercel.com](https://vercel.com)**.
2. Click **Sign Up**.
3. When it asks how you want to sign up, choose **Continue with GitHub**. This links the two accounts.
4. On the screen that asks you to install Vercel, click **Install** and approve access to your repositories.
5. Once you're in the Vercel dashboard, click **Add New…** → **Project**.
6. You'll see your `tac-training` repo listed. Click **Import** next to it.
7. A configuration screen appears. **Don't change anything.** Vercel auto-detects that this is a Vite project.
8. Click the big **Deploy** button at the bottom.
9. Wait about 45 seconds while it builds. You'll see a celebration animation when it's done.
10. Click **Continue to Dashboard** or the preview screenshot. You'll see a URL at the top like `tac-training-abc123.vercel.app`.

**Copy that URL.** That's your app, live on the internet.

---

## Step 5 — Install on your iPhone (1 min)

1. On your iPhone, open **Safari** (it has to be Safari, not Chrome — only Safari can add PWAs to the home screen on iOS).
2. Paste your Vercel URL into the address bar and go to the page. You'll see your workout tracker.
3. Tap the **Share button** at the bottom of Safari (the square with an arrow pointing up).
4. Scroll down in the share sheet and tap **Add to Home Screen**.
5. You can rename it here if you want (default is "TAC"). Tap **Add** in the top-right.

The icon appears on your home screen. Tap it — the app opens full-screen with no browser UI, just like a real app.

---

## Step 6 — Test the persistence

This is the whole point. Let's make sure data survives a full close.

1. Open TAC from your home screen.
2. Start a workout and log a couple of sets.
3. Finish the workout.
4. **Force-quit the app** (swipe up from the bottom, then swipe the TAC card away).
5. Wait a minute.
6. Tap the icon again.

Your workout should be in History. If it is, you're done forever. All future workouts save to the same place, untouched by Claude's iframe issues, safe as long as your phone exists.

---

## What if something goes wrong?

### The Vercel build failed
Go to the Vercel dashboard → your project → **Deployments** tab → click the failed one → read the log. The most common reason is a missing file. Scroll up to Step 3 and verify all the files actually uploaded (especially `package.json` and `index.html`). You can re-upload by going to your GitHub repo and dragging the missing files in.

### The app opens but looks broken
Open the URL in Safari on your phone first (not from home screen) and reload the page. Sometimes the first load doesn't cache properly. If it still looks broken, the browser's Web Inspector on a Mac can show errors — or come back and paste the URL and I'll take a look.

### The data still doesn't persist
Make sure you added it to the **home screen**, not just bookmarked it. And make sure you're opening it from the home screen icon, not from Safari. Safari tabs can get cleared; home-screen PWAs cannot.

### I want to make changes later
Any changes to the code (which you'd make by editing files in your GitHub repo in the browser) automatically redeploy to Vercel within about 30 seconds. Your phone will pick up the new version next time you open the app.

---

## A note on how this works

Your workout data is stored in something called `localStorage`, which lives in your phone's Safari storage — not on any server. That means:

- **Good:** Your data is private. I can't see it. Vercel can't see it. GitHub can't see it.
- **Good:** It works offline. You can log workouts at a gym with no signal.
- **Trade-off:** The data is tied to this one phone. If you get a new phone, it doesn't automatically come with you. The Excel export button exists for exactly this reason — periodically export a backup if your data matters to you.

If you ever outgrow this setup and want to sync across devices, that's when you'd add a real backend. But you don't need one today.
