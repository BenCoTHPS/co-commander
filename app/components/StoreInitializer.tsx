'use client';
import { useRef } from 'react';
import { useAppStore } from '@/lib/store';

export default function StoreInitializer({ user }: { user: any }) {
  const initialized = useRef(false);
  
  if (!initialized.current) {
    useAppStore.setState({ twitchUser: user });
    initialized.current = true;
  }
  
  return null; // This component renders nothing visually
}