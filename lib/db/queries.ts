import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function saveCredential(platform: string, token: string) {
  try {
    await prisma.userCredential.upsert({
      where: { platform: platform },
      update: { token: token },
      create: { platform: platform, token: token },
    });
    
    // Tells Next.js to refresh the UI with the new data
    revalidatePath('/'); 
    return { success: true };
  } catch (error) {
    console.error(`Failed to save ${platform} credential:`, error);
    return { success: false };
  }
}

export async function getCredentials() {
  // Fetches all saved credentials from the database
  return await prisma.userCredential.findMany();
}

export async function clearCredentials(platform?: string) {
  try {
    if (platform) {
      await prisma.userCredential.deleteMany({
        where: { platform }
      });
    } else {
      // The "Nuke" option for debugging
      await prisma.userCredential.deleteMany({});
    }
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Failed to clear credentials:", error);
    return { success: false };
  }
}