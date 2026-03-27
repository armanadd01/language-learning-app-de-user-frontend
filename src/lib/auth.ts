'use client';

import * as React from 'react';

const TOKEN_KEY = 'll_de_token';
const TOKEN_EVENT = 'll_de_token_change';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function useHasToken() {
  const [hasToken, setHasToken] = React.useState(false);

  React.useEffect(() => {
    function sync() {
      setHasToken(Boolean(getToken()));
    }

    sync();

    // Cross-tab updates
    function onStorage(e: StorageEvent) {
      if (e.key === TOKEN_KEY) sync();
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener(TOKEN_EVENT, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(TOKEN_EVENT, sync);
    };
  }, []);

  return hasToken;
}
