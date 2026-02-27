import { prisma } from '../db/prisma';
import { refreshTwitchToken } from '../actions/auth.actions';

export async function getValidTwitchToken() {
  const credential = await prisma.userCredential.findUnique({
    where: { platform: 'twitch' }
  });

  if (!credential) return null;

  const tokens = JSON.parse(credential.token);
  
  // We check if the token expires in the next 5 minutes 
  // (using the updatedAt time from Prisma + the expires_in from Twitch)
  const expiryTime = credential.updatedAt.getTime() + (tokens.expires_in * 1000);
  const buffer = 5 * 60 * 1000; // 5 minute buffer

  if (Date.now() + buffer > expiryTime) {
    console.log("Twitch token expired or expiring soon. Refreshing...");
    return await refreshTwitchToken();
  }

  return tokens.access_token;
}

export async function startDeviceFlow() {
  const response = await fetch('https://id.twitch.tv/oauth2/device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
      scope: 'user:read:email chat:read chat:edit channel:read:subscriptions',
    }),
  });

  const data = await response.json();
  // Returns: device_code, user_code, verification_uri, expires_in, interval
  return data;
}