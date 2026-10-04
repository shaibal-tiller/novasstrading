# Analytics setup (Google Analytics 4 + Search Console)

This switches on two things:

- **The tracking tag on the public site.** A small cookie bar asks visitors to Accept or Decline. Google Analytics loads only after **Accept**. Nobody is tracked before they choose, or after they decline.
- **The Analytics page in the admin** (`/admin/analytics`, a card on `/admin` for anyone with Website access). It shows visitors, where they come from, popular pages, countries, devices, contact-form enquiries, and what people search on Google.

You need about 30 minutes and the Google account that owns the website. Nothing changes until the values below are added in Vercel and the site is redeployed.

| Value | Goes into Vercel variable | Secret? |
|---|---|---|
| Measurement ID (`G-…`) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No |
| Numeric property ID (`123456789`) | `GA4_PROPERTY_ID` | No |
| Service-account JSON key file | `GOOGLE_SERVICE_ACCOUNT_JSON` | **Yes** |
| Search Console property (`https://novasstrading.com/` or `sc-domain:novasstrading.com`) | `GSC_SITE_URL` | No |
| Optional: website host (`novasstrading.com`) | `GA4_HOSTNAME` | No |

---

## 1. GA4 property and web stream

1. Go to **https://analytics.google.com** and sign in.
2. If there is no property for the site yet: click **Admin** (gear icon, bottom left), then **Create → Property**. Name it `novasstrading.com`, set the time zone to **(GMT+06:00) Bangladesh**, then click Next until it is created.
3. In **Admin → Data collection and modification → Data streams**, click **Add stream → Web**. Enter `https://novasstrading.com`, name it `Website`, then click **Create stream**. If a stream already exists, click it.
4. Copy the **Measurement ID** (`G-XXXXXXXXXX`). This goes into `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
5. Go to **Admin → Property details** (under *Property settings*) and copy the **Property ID**, a number like `123456789`. This goes into `GA4_PROPERTY_ID`.
6. Optional but recommended: **Admin → Events → Create event / Mark as key event**, and mark `contact_form_submit` as a **key event**. The site sends this event each time the contact form is sent successfully.

> **Staging:** create a second, separate GA4 property for staging and use its IDs in Vercel's **Preview** environment. Put the real production IDs in **Production** only, so test visits never mix with real ones. You can also set `GA4_HOSTNAME=novasstrading.com` so the admin page counts only that host. (The "active now" badge can't be filtered by host, because Google's realtime reports don't offer it.)

## 2. Google Cloud project and APIs

1. Go to **https://console.cloud.google.com** with the same Google account.
2. In the project picker at the top, click **New project**. Name it `novass-analytics`, then click **Create** and select the new project.
3. Open **APIs & Services → Library**. Search for and **Enable** both of these:
   - **Google Analytics Data API**
   - **Google Search Console API**

## 3. Service account and JSON key

1. Go to **IAM & Admin → Service accounts → Create service account**.
2. Name it `website-analytics-reader` and click **Create and continue**. It needs **no** project roles, so click **Continue**, then **Done**.
3. Click the new service account and copy its **email** (it looks like `website-analytics-reader@novass-analytics.iam.gserviceaccount.com`). You will need it in steps 4 and 5.
4. Open the **Keys** tab and click **Add key → Create new key → JSON → Create**. A `.json` file downloads.
5. Treat that file like a password. Don't email it or commit it to git. Paste its **entire contents** into `GOOGLE_SERVICE_ACCOUNT_JSON` (step 6), then delete the downloaded file. If Vercel mangles the line breaks, you can paste the file's base64 instead: on a Mac, run `base64 -i key.json | pbcopy`.

## 4. Give the service account read access in GA4

1. In Google Analytics, go to **Admin → Property access management** (under *Property settings*).
2. Click **+ → Add users**, paste the service-account email, and choose the role **Viewer**.
3. Untick "Notify new users", then click **Add**.

## 5. Give the service account read access in Search Console

1. Go to **https://search.google.com/search-console** and select the site's property. If the site isn't verified yet, add it first: the **Domain** type is verified through a DNS TXT record, and **URL prefix** works with the HTML-tag method.
2. Go to **Settings → Users and permissions → Add user**.
3. Paste the service-account email, set permission to **Restricted**, and click **Add**.
4. Note the property name exactly as shown in the top-left picker. Copy it into `GSC_SITE_URL`:
   - for a URL-prefix property, use the full URL with its trailing slash: `https://novasstrading.com/`
   - for a Domain property, use `sc-domain:novasstrading.com`

## 6. Add the values in Vercel

1. Go to **Vercel → the website project → Settings → Environment Variables**.
2. Add each value from the table at the top. Tick **Production** for the real IDs and put the staging property's IDs under **Preview**. Mark `GOOGLE_SERVICE_ACCOUNT_JSON` as **Sensitive**.
3. **Redeploy**: the `NEXT_PUBLIC_…` value is built into the site, so it needs a fresh deployment.

## 7. Check it works

- Open the public site in a private window. The cookie bar appears. Click **Accept**, then in GA4 open **Reports → Realtime**: your visit shows within a minute. Click **Decline** in another private window and nothing is sent.
- Open **/admin → Analytics**. Any panel that can't load shows a plain-English reason, for example *"permission denied — add the service account as a Viewer"*. That usually means step 4 or 5 was missed.
- New sites show little data at first. GA4 reports take up to a day to fill in, and Search Console runs **2–3 days behind**, so its panels always end 3 days ago.

To stop tracking at any time, remove `NEXT_PUBLIC_GA_MEASUREMENT_ID` and redeploy. To cut the admin page's access, delete the service account's key in Google Cloud.
