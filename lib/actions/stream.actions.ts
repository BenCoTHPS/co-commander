'use server'

import { revalidatePath } from 'next/cache';
import { getChannelInfo, updateChannelInfo, searchTwitchCategories } from '../twitch/api';

export async function fetchCurrentStreamInfo() {
  return await getChannelInfo();
}

export async function searchCategoriesAction(query: string) {
  if (!query || query.length < 2) return [];
  return await searchTwitchCategories(query);
}

export async function updateStreamAction(title: string, gameId: string) {
  const result = await updateChannelInfo(title, gameId);
  if (result.success) {
    revalidatePath('/'); // Refreshes the server components to show new data
  }
  return result;
}