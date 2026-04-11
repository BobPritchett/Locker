import { auth } from '../../../../server/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const { GET, POST: originalPOST } = toNextJsHandler(auth);

async function POST(req: NextRequest) {
  // Gate registration behind an email allowlist when ALLOWED_EMAILS is set
  if (req.nextUrl.pathname.endsWith('/sign-up/email')) {
    const allowedEmails = process.env.ALLOWED_EMAILS;
    if (allowedEmails) {
      const body = await req.json();
      const allowed = allowedEmails.split(',').map((e) => e.trim().toLowerCase());
      if (!allowed.includes(body.email?.toLowerCase())) {
        return NextResponse.json(
          { error: { message: 'Registration is not open', code: 'REGISTRATION_DISABLED' } },
          { status: 403 },
        );
      }
      // Reconstruct the request since we consumed the body
      req = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(body),
      });
    }
  }
  return originalPOST(req);
}

export { GET, POST };
