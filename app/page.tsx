import { getCredentials, clearCredentials } from '../lib/db/queries';
import { syncTwitchProfile, getLiveTwitchStats } from '../lib/twitch/api';
import { useAppStore } from '../lib/store';
import LoginButton from './components/auth/LoginButton';
import StreamManager from './components/stream/StreamManager';

export default async function Home() {
    const credentials = await getCredentials();
    let twitchCred: any = credentials.find((c: any) => c.platform === 'twitch');

    // Static profile data (from DB)
    if (twitchCred && !twitchCred.displayName) {
        twitchCred = await syncTwitchProfile();
    }

    // We define the reset handler as a Server Action directly
    async function handleReset() {
        'use server';
        await clearCredentials();
    }

    // Dynamic live data (Fresh from API)
    const stats = twitchCred ? await getLiveTwitchStats() : null;
    
    return (
        <main>
            <section>
                {twitchCred && stats ? (
                    <>
                        <div>
                            <img src={twitchCred.profileImage || ''} alt="Profile" />
                            <div>
                                <div>{twitchCred.displayName}</div>
                                <div>
                                    <span> {stats.isLive ? 'LIVE' : 'OFFLINE'} </span>
                                    <span> {stats.followers.toLocaleString()} Followers </span>
                                </div>
                            </div>
                        </div>
                        {stats.isLive && (
                            <div>
                                Currently playing <strong>{stats.gameName}</strong> with <strong>{stats.viewerCount}</strong> viewers.
                            </div>
                        )}
                        <div>
                            <span style={{ color: '#4caf50' }}>● Connected</span>
                            <form action={handleReset}>
                                <button type="submit" > Disconnect & Clear </button>
                            </form>
                        </div>
                        <StreamManager />
                    </>
                ) : (
                    <LoginButton />
                )}
            </section>
        </main>
    );
}