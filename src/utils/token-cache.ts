const TOKEN_CACHE_KEY = 'mapbox_token_cache';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const tokenCache = {
  set: (token: string) => {
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify({
      token,
      timestamp: Date.now()
    }));
  },

  get: (): string | null => {
    const cached = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!cached) return null;

    const { token, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > TOKEN_EXPIRY) {
      localStorage.removeItem(TOKEN_CACHE_KEY);
      return null;
    }

    return token;
  }
};
