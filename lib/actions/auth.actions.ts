'use server'

import { prisma } from '../db/prisma';

export async function loginWithTwitch() {
  try {
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

    if (!clientId) {
      return { error: "Missing Client ID. .env file might not be loading." };
    }

    const response = await fetch('https://id.twitch.tv/oauth2/device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        scope: 'user:read:email chat:read chat:edit channel:read:subscriptions channel:manage:broadcast',
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return { error: data.message || "Twitch rejected the request." };
    }

    return {
      device_code: data.device_code,
      user_code: data.user_code,
      verification_uri: data.verification_uri,
      interval: data.interval,
      expires_in: data.expires_in
    };
  } catch (err: any) {
    return { error: err.message || "Server fetch completely failed." };
  }
}

export async function pollForToken(deviceCode: string) {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
  
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });

  const data = await response.json();

  // Twitch returns 200 OK only when the user has finished
  if (response.ok && data.access_token) {
    await prisma.userCredential.upsert({
      where: { platform: 'twitch' },
      update: { token: JSON.stringify(data) },
      create: { platform: 'twitch', token: JSON.stringify(data) },
    });
    return { status: 'success' };
  }

  // Twitch returns 400 Bad Request while waiting
  if (data.message === 'authorization_pending') {
    return { status: 'pending' };
  }

  // Handle expiration (user took too long)
  if (data.error === 'expired_token') {
    return { status: 'expired' };
  }

  // Actual errors (e.g., invalid client ID)
  return { status: 'error', message: data.error };
}

export async function refreshTwitchToken() {
  const credential = await prisma.userCredential.findUnique({
    where: { platform: 'twitch' }
  });

  if (!credential) throw new Error("No Twitch credentials found.");

  const tokens = JSON.parse(credential.token);

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    // Save the brand new tokens back to the DB
    await prisma.userCredential.update({
      where: { platform: 'twitch' },
      data: { token: JSON.stringify(data) }
    });
    return data.access_token;
  }

  throw new Error("Failed to refresh token: " + (data.message || data.error));
}