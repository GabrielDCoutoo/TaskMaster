import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";

export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8000";

export const GITHUB_CLIENT_ID = Constants.expoConfig?.extra?.githubClientId || "";
export const GITHUB_REDIRECT_URI = Constants.expoConfig?.extra?.githubRedirectUri || AuthSession.makeRedirectUri();

export const UA_OAUTH_URL = Constants.expoConfig?.extra?.uaOauthUrl || "";
export const UA_CLIENT_ID = Constants.expoConfig?.extra?.uaClientId || "";
export const UA_REDIRECT_URI = Constants.expoConfig?.extra?.uaRedirectUri || AuthSession.makeRedirectUri();
