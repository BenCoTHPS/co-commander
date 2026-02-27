'use client';
import styles from "./styles.module.css";
import { useAppStore } from '@/lib/store';

export default function Header() {
  const twitchUser = useAppStore((state) => state.twitchUser);

  return (
    <header className={styles.header}>
        <span>Co-Command</span>
        
        {/* If the store has user data, render the mini-profile! */}
        {twitchUser && (
          <div>
             <span>{twitchUser.displayName}</span>
             <img 
               src={twitchUser.profileImage} 
               alt="Avatar" 
               style={{ width: '32px', height: '32px', borderRadius: '50%' }} 
             />
          </div>
        )}
    </header>
  )
}