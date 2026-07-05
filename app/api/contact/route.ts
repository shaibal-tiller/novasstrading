import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  companyName?: string;
  phone?: string;
  country?: string;
  subject?: string;
  message?: string;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let data: Payload;
  try {
    data = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = data.name?.trim();
  const email = data.email?.trim();
  const message = data.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 422 },
    );
  }
  if (!emailRe.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 422 },
    );
  }

  // ---------------------------------------------------------------------------
  // TODO: connect a real delivery mechanism here. Common options:
  //   • Resend / SendGrid / Postmark  (transactional email)
  //   • A CRM webhook (HubSpot, Zoho)
  //   • A database insert
  // Keep secrets in environment variables (e.g. process.env.RESEND_API_KEY).
  // For now we log on the server and acknowledge receipt.
  // ---------------------------------------------------------------------------
  console.info("New inquiry:", {
    name,
    email,
    company: data.companyName,
    subject: data.subject,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
