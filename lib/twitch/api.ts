import { getValidTwitchToken } from "./auth";

// We extract this so we don't have to rewrite it in every function
async function getMyTwitchId(token: string, clientId: string) {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId }
  });
  const { data } = await res.json();
  return data[0].id;
}

// --- Function 1: GET Stream Metadata ---
export async function getChannelInfo() {
  const token = await getValidTwitchToken();
  if (!token) return null;
  
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
  const userId = await getMyTwitchId(token, clientId);

  const res = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId }
  });
  
  const { data } = await res.json();
  
  // Returns: title, game_name, game_id, broadcaster_language, tags
  return data[0]; 
}

// --- Function 2: UPDATE Stream Metadata ---
export async function updateChannelInfo(title?: string, gameId?: string) {
  const token = await getValidTwitchToken();
  if (!token) return { success: false, error: "Not authenticated" };
  
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
  const userId = await getMyTwitchId(token, clientId);

  // We only send the fields that are actually provided
  const body: any = {};
  if (title) body.title = title;
  if (gameId) body.game_id = gameId;

  const res = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  // Twitch returns a 204 (No Content) status code if the update is successful
  if (res.status === 204) {
    return { success: true }; 
  }

  const errorData = await res.json();
  return { success: false, error: errorData.message || "Failed to update" };
}

// --- Function 3: Search Categories (To get the game_id) ---
export async function searchTwitchCategories(query: string) {
  const token = await getValidTwitchToken();
  if (!token) return [];
  
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;

  // URL encode the query so spaces don't break the fetch
  const encodedQuery = encodeURIComponent(query);
  const res = await fetch(`https://api.twitch.tv/helix/search/categories?query=${encodedQuery}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId }
  });

  const { data } = await res.json();
  
  // Returns an array of matching games: [{ id: "509658", name: "Just Chatting", box_art_url: "..." }]
  return data || [];
}

export async function getLiveTwitchStats() {
  const token = await getValidTwitchToken();
  if (!token) return null;

  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
  
  // 1. Get User ID (we need this for the other calls)
  const userRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId }
  });
  const { data: userData } = await userRes.json();
  const userId = userData[0].id;

  // 2. Get Follower Count
  // Note: 'total' is returned in the top level of this specific response
  const followRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId }
  });
  const followData = await followRes.json();

  // 3. Get Stream Status
  const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId }
  });
  const { data: streamData } = await streamRes.json();
  
  const isLive = streamData.length > 0;

  return {
    followers: followData.total || 0,
    isLive,
    viewerCount: isLive ? streamData[0].viewer_count : 0,
    gameName: isLive ? streamData[0].game_name : null,
  };
}

export async function syncTwitchProfile() {
  const token = await getValidTwitchToken();
  if (!token) return null;

  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!
    }
  });

  const { data } = await response.json();
  const user = data[0];

  if (user) {
    // Save the profile info to the database
    return await prisma.userCredential.update({
      where: { platform: 'twitch' },
      data: {
        "displayName": user.display_name,
        "profileImage": user.profile_image_url,
      }
    });
  }

  return null;
}

