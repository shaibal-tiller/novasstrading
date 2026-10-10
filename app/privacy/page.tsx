import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/content";
import { CookieSettingsLink } from "@/components/CookieSettingsLink";

const UPDATED = "9 October 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your information when you visit this website or send us an enquiry.`,
  alternates: { canonical: `${site.url}/privacy` },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-medium text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[1.02rem] leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const hasAnalytics = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink/10 bg-ivory">
        <div className="shell flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" aria-label={`${site.name} home`}>
            <Image src="/logo.png" alt="" width={48} height={48} className="h-11 w-auto object-contain" priority />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                NOVA SS<span className="text-brass">.</span>
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink-muted">Trading</span>
            </span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-ink/80 transition-colors hover:text-brass-dark">
            ← Back to the website
          </Link>
        </div>
      </header>

      <main className="shell max-w-3xl py-12 sm:py-16">
        <span className="eyebrow">Legal</span>
        <h1 className="display-lg mt-3 text-ink">Privacy Policy</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated: {UPDATED}</p>
        <p className="lede mt-6">
          {site.name} is a garments buying house in Bangladesh. This page explains what personal information we
          collect on {site.url.replace("https://", "")}, why, who else sees it, and the choices you have. We keep it
          short and plain on purpose.
        </p>

        <Section title="Who we are">
          <p>
            The company responsible for your information is <strong>{site.legalName}</strong>, {site.address.full}.
            You can reach us at <a className="text-brass-dark underline underline-offset-2" href={`mailto:${site.email}`}>{site.email}</a> or {site.phone}.
          </p>
        </Section>

        <Section title="What we collect, and why">
          <p>
            <strong>When you send us an enquiry</strong> through the contact form, we receive what you type: your name,
            company, email address, phone number, country, the subject and your message. We use it only to reply to you
            and to discuss sourcing with you.
          </p>
          <p>
            <strong>To protect the form from spam and abuse</strong>, the site also notes technical details of the
            submission: your IP address, your browser and device type, the time, and an approximate location worked out
            from the IP address (country, region, city, internet provider). This is included in the email our team
            receives. We use it to spot and block abuse, and a short-lived record of IP addresses is kept in memory to
            limit how often one connection can submit the form.
          </p>
          <p>
            <strong>When you simply browse</strong>, our hosting provider keeps routine technical logs (such as your IP
            address and the pages requested) for security and to keep the site running.
          </p>
          <p>
            <strong>If you accept analytics cookies</strong>, Google Analytics tells us, in aggregate, how visitors find
            and use the site: pages viewed, time on site, country, device type and how you arrived. We use this to
            improve the website. We do not use it to identify you.
          </p>
        </Section>

        <Section title="Cookies and analytics">
          <p>
            If you are visiting from the European Economic Area, the United Kingdom or Switzerland, we only set
            analytics cookies if you choose <strong>Accept</strong> in the banner. If you choose{" "}
            <strong>Decline</strong>, or you do not choose at all, no analytics cookies are set and nothing is sent to
            Google Analytics. In other countries we do not show the banner and count visits by default, and you can
            switch analytics off at any time. Your choice is remembered on your device (in your browser&apos;s local storage, under the
            name <code className="rounded bg-ivory px-1.5 py-0.5 text-sm">nova_consent</code>), and you can change it at
            any time{hasAnalytics ? <> using <CookieSettingsLink className="text-brass-dark underline underline-offset-2" /> here or in the page footer</> : <> from the &ldquo;Cookie settings&rdquo; link in the page footer</>}.
          </p>
          <p>
            If accepted, Google sets cookies named <code className="rounded bg-ivory px-1.5 py-0.5 text-sm">_ga</code> and{" "}
            <code className="rounded bg-ivory px-1.5 py-0.5 text-sm">_ga_…</code>, which last up to two years. Declining
            later removes them. The embedded map in our Contact section is provided by Google Maps; loading it shares
            your IP address with Google. Our own staff area uses a sign-in cookie that is never set for visitors.
          </p>
        </Section>

        <Section title="Who we share it with">
          <p>
            We do not sell your information. We share it only with trusted service providers who help us run the
            website and answer your enquiries, such as website hosting, email delivery, and (only if you accept
            analytics cookies) website analytics and maps, and only as much as they need to do that job.
          </p>
          <p>
            Some of these providers are outside your country, so your information may be processed abroad. We may also
            disclose information if the law requires it.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Enquiry emails are kept for as long as we are in touch with you and for a reasonable time afterwards for our
            business records, then deleted. Analytics data is kept for the limited period configured in our Google
            Analytics account. The website does not keep a database of enquiries; they live in our email.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <p>
            Depending on where you live (for example the UK or European Union), you may ask us to show you the
            information we hold about you, correct it, delete it, restrict or object to how we use it, or give it to you
            in a portable form. You can also withdraw your cookie consent at any time. Email{" "}
            <a className="text-brass-dark underline underline-offset-2" href={`mailto:${site.email}`}>{site.email}</a>{" "}
            and we will respond within a reasonable time. If you are unhappy with our answer, you have the right to
            complain to your local data-protection authority.
          </p>
        </Section>

        <Section title="Security and children">
          <p>
            The site uses HTTPS encryption, and enquiries go straight to our email rather than being stored on the
            website. No system is perfectly secure, so please do not send us sensitive personal data you do not need to
            share. This site is for business customers and is not directed at children.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we change how we handle information we will update this page and the date at the top. Questions are
            always welcome at <a className="text-brass-dark underline underline-offset-2" href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </Section>
      </main>
    </div>
  );
}
