# 📊 Web Analytics Setup Guide — Nova SS Trading

> **Difficulty:** Easy (no coding needed — just copy-paste)
> **Time needed:** ~30 minutes total
> **Cost:** Completely FREE — all three tools are free forever

This guide walks you through setting up **3 analytics tools** for novasstrading.com. After setup, you'll be able to see:

- How many people visit your website every day
- Which countries your visitors come from
- What Google searches lead people to your site
- Exactly where visitors click and how far they scroll
- Which pages are most popular
- Whether your contact form is getting attention

---

## Table of Contents

1. [Google Analytics 4 (GA4)](#1-google-analytics-4-ga4) — Visitor tracking
2. [Google Search Console](#2-google-search-console) — SEO & Google rankings
3. [Microsoft Clarity](#3-microsoft-clarity) — Heatmaps & session recordings
4. [Adding the Tracking Codes to Your Website](#4-adding-the-tracking-codes-to-your-website)
5. [How to Read Your Analytics (Daily/Weekly)](#5-how-to-read-your-analytics)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Google Analytics 4 (GA4)

**What it does:** Tells you how many people visit your website, where they're from, what device they use, which pages they look at, and how long they stay.

### Step 1.1 — Create a Google Analytics Account

1. Open your browser and go to: **https://analytics.google.com**
2. Sign in with your **Google account** (the same Gmail you use for anything Google)
3. If this is your first time, you'll see a **"Start measuring"** button — click it

### Step 1.2 — Set Up Your Account

You'll see a form with 3 steps. Fill them in like this:

**Account Setup:**
| Field | What to type |
|-------|-------------|
| Account name | `Nova SS Trading` |
| Data sharing | Leave all checkboxes ON (they're fine) |

Click **Next**.

**Property Setup:**
| Field | What to type |
|-------|-------------|
| Property name | `novasstrading.com` |
| Reporting time zone | `(GMT+06:00) Bangladesh Time` |
| Currency | `BDT (Bangladeshi Taka)` |

Click **Next**.

**Business Details:**
| Field | What to select |
|-------|---------------|
| Industry category | `Business & Industrial` |
| Business size | `Small` |

Click **Next**.

**Business Objectives:**
- Select **"Get baseline reports"** (this gives you the standard dashboard)
- Click **Create**

### Step 1.3 — Create a Web Data Stream

1. You'll be asked to choose a platform — click **"Web"**
2. Fill in:
   | Field | What to type |
   |-------|-------------|
   | Website URL | `novasstrading.com` (select `https://` from the dropdown) |
   | Stream name | `Website` |
3. Click **"Create stream"**

### Step 1.4 — Copy Your Measurement ID

After creating the stream, you'll see a page with your stream details.

1. Look for **"Measurement ID"** — it starts with `G-` followed by letters and numbers
   - Example: `G-ABC123XYZ`
2. **Write this down** or copy it somewhere safe — you'll need it in [Step 4](#4-adding-the-tracking-codes-to-your-website)

> 💡 **Tip:** You can always find this later by going to:
> Analytics → Admin (gear icon at bottom-left) → Data Streams → click your stream

---

## 2. Google Search Console

**What it does:** Shows you what people type into Google before they find your website. Also tells you if Google is having trouble reading any of your pages.

### Step 2.1 — Open Search Console

1. Go to: **https://search.google.com/search-console**
2. Sign in with the **same Google account** you used for Analytics

### Step 2.2 — Add Your Website

1. Click **"Add property"** (or you'll see this option if it's your first time)
2. You'll see two options. Choose the **right side: "URL prefix"**
3. Type in: `https://novasstrading.com`
4. Click **Continue**

### Step 2.3 — Verify You Own the Website

Google needs to confirm this is actually your website. There are several methods — use **"HTML tag"** (easiest):

1. In the verification options, click **"HTML tag"**
2. You'll see a line of code that looks like this:
   ```html
   <meta name="google-site-verification" content="a1b2c3d4e5f6g7h8i9j0...">
   ```
3. **Copy this entire line** — you'll need it in [Step 4](#4-adding-the-tracking-codes-to-your-website)
4. **Don't click "Verify" yet** — do that AFTER you've added the code to your website

> ⚠️ **Important:** Don't close this tab! You'll come back here to click "Verify" after adding the code.

---

## 3. Microsoft Clarity

**What it does:** Records what visitors do on your site — you can literally watch playback videos of visitors scrolling, clicking, and navigating. It also generates heatmaps showing where people click most.

### Step 3.1 — Create a Clarity Account

1. Go to: **https://clarity.microsoft.com**
2. Click **"Sign up"** — you can use your Google account, Microsoft account, or Facebook
3. Sign in

### Step 3.2 — Create a New Project

1. Click **"+ New Project"**
2. Fill in:
   | Field | What to type |
   |-------|-------------|
   | Name | `novasstrading.com` |
   | Website URL | `https://novasstrading.com` |
   | Category | `Business` |
3. Click **"Create"**

### Step 3.3 — Get Your Tracking Code

1. After creating the project, Clarity shows you a tracking script
2. In that script, look for a line that contains something like:
   ```
   clarity("set", "abcdefghij");
   ```
   or at the top of the script:
   ```
   (function(c,l,a,r,i,t,y){ ... })(window,document,"clarity","script","abcdefghij");
   ```
3. That random string (like `abcdefghij`) is your **Project ID**
4. **Write it down** — you'll need it in [Step 4](#4-adding-the-tracking-codes-to-your-website)

> 💡 **Easier option:** Just copy the **entire script block** Clarity gives you. It's about 6 lines of code.

---

## 4. Adding the Tracking Codes to Your Website

Now you have 3 things written down:

| Tool | What you have | Looks like |
|------|--------------|------------|
| Google Analytics | Measurement ID | `G-ABC123XYZ` |
| Search Console | HTML meta tag | `<meta name="google-site-verification" content="...">` |
| Microsoft Clarity | Project ID | `abcdefghij` |

### Step 4.1 — Open Your Website Files

You need to add the tracking code to **every HTML page** on your site. There are 6 pages:

1. `index.html` (Home page)
2. `divisions.html`
3. `sourcing.html`
4. `compliance.html`
5. `profiles.html`
6. `contact.html`

**How to edit files in cPanel:**
1. Log into your cPanel at your hosting provider
2. Click **"File Manager"**
3. Navigate to `public_html` folder
4. Right-click on a file (e.g., `index.html`) → click **"Edit"**

### Step 4.2 — Add the Code

In **each of the 6 HTML files**, find this line near the top:

```html
<head>
```

Right BELOW that `<head>` line, **paste the following block** (replace the placeholder values with your real IDs):

```html
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
    </script>

    <!-- Google Search Console Verification -->
    <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE">

    <!-- Microsoft Clarity -->
    <script type="text/javascript">
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","YOUR_CLARITY_PROJECT_ID");
    </script>
```

**Replace these with your real values:**
- `G-XXXXXXXXXX` → Your GA4 Measurement ID (appears **twice** in the code!)
- `YOUR_VERIFICATION_CODE_HERE` → The content value from your Search Console meta tag
- `YOUR_CLARITY_PROJECT_ID` → Your Clarity project ID

### Step 4.3 — Save and Repeat

1. After pasting the code, click **"Save Changes"** in cPanel
2. Repeat for **all 6 HTML files**
3. The code goes in the **exact same spot** in every file (right after `<head>`)

### Step 4.4 — Verify Search Console

1. Go back to the Search Console tab you left open
2. Click **"Verify"**
3. You should see: ✅ **"Ownership verified"**

> If verification fails, wait 5 minutes and try again — sometimes cPanel takes a moment to save.

---

## 5. How to Read Your Analytics

### 📈 Google Analytics — Check Daily

**Where to go:** https://analytics.google.com

**Dashboard overview (what each number means):**

| Metric | What it means | Good sign |
|--------|--------------|-----------|
| **Users** | Number of unique visitors | Going up over time |
| **Sessions** | Total visits (one person can visit multiple times) | Higher than Users |
| **Avg. engagement time** | How long people spend on your site | More than 1 minute |
| **Bounce rate** | % of people who leave after seeing only 1 page | Below 60% |

**Useful reports to check:**

1. **Reports → Realtime** — See who's on your site RIGHT NOW
2. **Reports → Acquisition → Traffic acquisition** — See WHERE visitors come from:
   - `Organic Search` = found you on Google
   - `Direct` = typed your URL directly
   - `Referral` = clicked a link from another website
   - `Social` = came from social media
3. **Reports → Engagement → Pages and screens** — See which pages are most visited
4. **Reports → Demographics → Demographic details** — See which countries/cities visitors are from

---

### 🔍 Google Search Console — Check Weekly

**Where to go:** https://search.google.com/search-console

**Key reports:**

1. **Performance** (most important!) — Click it and you'll see:
   | Column | What it means |
   |--------|--------------|
   | **Queries** | What words people typed into Google to find you |
   | **Clicks** | How many times people clicked your site from Google |
   | **Impressions** | How many times your site appeared in Google results |
   | **CTR** | Click-through rate (% of people who saw AND clicked) |
   | **Position** | Your average ranking position (1 = top of Google) |

2. **Pages** tab — Shows which of your pages gets the most Google traffic

3. **Coverage / Indexing** — Shows if Google has any trouble reading your pages. You want to see all pages marked as "Valid"

> 💡 **Pro tip:** Search Console data takes **2-3 days** to appear. Don't worry if you see nothing on day one.

---

### 🔥 Microsoft Clarity — Check Weekly

**Where to go:** https://clarity.microsoft.com → click your project

**What to look at:**

1. **Dashboard** — Overview of:
   - Total sessions
   - Pages per session
   - Scroll depth (how far down people scroll)
   - **Dead clicks** (places people click but nothing happens — means something looks clickable but isn't)
   - **Rage clicks** (people clicking the same spot repeatedly out of frustration)

2. **Recordings** — This is the most powerful feature:
   - Click "Recordings" in the left sidebar
   - You'll see a list of real visitor sessions
   - Click any one to **watch a video** of exactly what that person did on your site
   - You can see their mouse movements, scrolling, clicks, and page navigation
   - Great for finding confusing parts of your website

3. **Heatmaps** — Click "Heatmaps" in the sidebar:
   - Shows a color overlay on your pages
   - **Red/orange areas** = lots of clicks (popular)
   - **Blue/green areas** = few clicks (ignored)
   - Useful for seeing if people notice your "Inquire Now" button

---

## 6. Troubleshooting

### "I don't see any data in Google Analytics"
- Data takes **up to 24 hours** to appear
- Check **Realtime** report first — it shows data instantly
- Visit your own website in another browser/phone, then check Realtime

### "Search Console says 'Not verified'"
- Make sure the `<meta>` tag is in ALL your HTML files
- Make sure it's inside the `<head>` section, not inside `<body>`
- Wait 5 minutes after saving and try verifying again

### "Clarity shows 0 recordings"
- Recordings appear after real visitors come to your site
- Visit your own site from your phone to create the first recording
- Clarity may take **up to 2 hours** to process the first recording

### "I only see my own visits"
- In Google Analytics, you can filter out your own IP:
  - Go to Admin → Data Streams → your stream → Configure tag settings
  - Click "Define internal traffic" → add your IP address
- Clarity: Click Settings → IP Blocking → add your IP

### "I made a mistake in the code"
- If the website looks broken after editing, you probably accidentally deleted a `<` or `>` character
- Re-download the original HTML file from GitHub and start fresh
- The tracking code should go **between** `<head>` and `</head>`, nowhere else

---

## Quick Reference Card

| Tool | URL | Check | Takes to load |
|------|-----|-------|---------------|
| Google Analytics | analytics.google.com | Daily | 24 hours |
| Search Console | search.google.com/search-console | Weekly | 2-3 days |
| Microsoft Clarity | clarity.microsoft.com | Weekly | 2 hours |

---

> **Need help adding the code?** Share your 3 tracking IDs with your developer and they can add them to all pages in a few minutes. The IDs are safe to share — they only allow *reading* your analytics, not changing your website.
