'use client';

import { useState, useEffect } from 'react';
import { loginWithTwitch, pollForToken } from '@/lib/actions';

export default function LoginButton() {
  const [authData, setAuthData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>(''); // NEW: Track the exact error

  const handleStartFlow = async () => {
    setStatus('pending');
    setErrorMsg(''); // Reset error state
    
    try {
      const data = await loginWithTwitch();
      
      // If data is undefined or contains an error
      if (!data || data.error) {
        setErrorMsg(data?.error || "Received empty response from server");
        setStatus('error');
        return;
      }
      setAuthData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Server action failed to execute");
      setStatus('error');
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const performPoll = async () => {
      // 1. Don't run if we aren't supposed to
      if (!authData?.device_code || status !== 'pending' || !isMounted) return;

      // 2. Do the single check
      const result = await pollForToken(authData.device_code);

      if (!isMounted) return;

      // 3. Handle the result
      if (result.status === 'success') {
        window.location.reload();
        return;
      }

      if (result.status === 'pending') {
        // It's still waiting. Wait 5 seconds, then call THIS function again.
        timer = setTimeout(performPoll, (authData.interval || 5) * 1000);
        return;
      }

      // 4. If it's anything else (expired/error), stop and show error
      setStatus('error');
    };

    if (status === 'pending' && authData) {
      performPoll();
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [authData, status]);

  if (status === 'success') return <div style={{ color: 'green' }}>✓ Connected!</div>;

  return (
    <div style={{ padding: '10px'}}>
      {status === 'idle' && (
        <button onClick={handleStartFlow} style={twitchButtonStyle}>
          Login with Twitch
        </button>
      )}

      {status === 'pending' && !authData && (
        <p>Requesting code from Twitch...</p>
      )}

      {status === 'pending' && authData && (
        <div style={{ textAlign: 'center' }}>
          <p>Go to: <a href={authData.verification_uri} target="_blank" style={{ color: '#9146FF' }}>{authData.verification_uri}</a></p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0' }}>
            {authData.user_code}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#888' }}>Waiting for you to authorize...</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#ff5252', fontWeight: 'bold' }}>Error: {errorMsg}</p>
          <button onClick={() => setStatus('idle')} style={{...twitchButtonStyle, marginTop: '10px', backgroundColor: '#333'}}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

const twitchButtonStyle = {
  backgroundColor: '#9146FF',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold' as const
};