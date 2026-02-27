import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('twitch_code_verifier')?.value;

  // 1. Check for the code and verifier
  if (!code || !codeVerifier) {
    return NextResponse.json({ error: 'Missing code or verifier' }, { status: 400 });
  }

  // 2. The Secret-less Token Exchange (PKCE)
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI!,
    }),
  });

  const tokens = await response.json();

  if (tokens.access_token) {
    // 3. Save to your existing Configuration Layer table
    // We store the whole token object (which includes the refresh_token)
    await prisma.userCredential.upsert({
      where: { platform: 'twitch' },
      update: { token: JSON.stringify(tokens) },
      create: { platform: 'twitch', token: JSON.stringify(tokens) },
    });

    // 4. Cleanup and Redirect
    cookieStore.delete('twitch_code_verifier');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If we get here, Twitch rejected the token exchange
  return NextResponse.json({ error: 'Token exchange failed', details: tokens }, { status: 500 });
}