const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_STATE_KEY = "digital_rental_google_oauth_state";

const setCookie = (name: string, value: string, maxAgeSeconds = 600) => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
};

export const getGoogleRedirectUri = () => {
  if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/google/callback`;
  }
  return "";
};

const createState = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

let lastConsumedState: string | null = null;
let lastConsumedTime = 0;

export function startGoogleOAuth() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google Client ID chưa được cấu hình.");
  }

  const redirectUri = getGoogleRedirectUri();

  // If user is accessing via 127.0.0.1 (or vice-versa) while redirectUri is configured on a different host
  if (typeof window !== "undefined" && redirectUri) {
    try {
      const redirectUrlObj = new URL(redirectUri, window.location.origin);
      if (
        window.location.origin !== redirectUrlObj.origin &&
        ((window.location.hostname === "127.0.0.1" && redirectUrlObj.hostname === "localhost") ||
          (window.location.hostname === "localhost" && redirectUrlObj.hostname === "127.0.0.1"))
      ) {
        const targetUrl = new URL(window.location.href);
        targetUrl.protocol = redirectUrlObj.protocol;
        targetUrl.host = redirectUrlObj.host;
        targetUrl.searchParams.set("triggerGoogle", "true");
        window.location.href = targetUrl.toString();
        return;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  const state = createState();

  // Store across sessionStorage, localStorage, and cookie for bulletproof retrieval after redirects
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
    } catch {}
    try {
      localStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
    } catch {}
    try {
      setCookie(GOOGLE_OAUTH_STATE_KEY, state, 600);
    } catch {}
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function getGoogleRedirectUriForBackend() {
  return getGoogleRedirectUri();
}

export function consumeGoogleOAuthState(receivedState: string | null): boolean {
  if (!receivedState) return false;

  // React Strict Mode or double-render safety window (10 seconds)
  if (receivedState === lastConsumedState && Date.now() - lastConsumedTime < 10000) {
    return true;
  }

  let sessionState: string | null = null;
  let localState: string | null = null;
  let cookieState: string | null = null;

  if (typeof window !== "undefined") {
    try {
      sessionState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    } catch {}
    try {
      localState = localStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    } catch {}
    try {
      cookieState = getCookie(GOOGLE_OAUTH_STATE_KEY);
    } catch {}
  }

  const matched =
    receivedState === sessionState ||
    receivedState === localState ||
    receivedState === cookieState;

  if (matched) {
    lastConsumedState = receivedState;
    lastConsumedTime = Date.now();

    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
      } catch {}
      try {
        localStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
      } catch {}
      try {
        deleteCookie(GOOGLE_OAUTH_STATE_KEY);
      } catch {}
    }
    return true;
  }

  return false;
}
