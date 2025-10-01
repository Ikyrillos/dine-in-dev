import { useAuthStore } from "@/stores/auth-store";
import axios from "axios";
import { BASE_URL } from "./apis-endpoints";

const baseURL = BASE_URL;
const fallbackBaseURL = BASE_URL;

// Token expiration handler
let tokenExpirationHandler: (() => void) | null = null;

// Function to set the token expiration handler
export const setTokenExpirationHandler = (handler: () => void) => {
    tokenExpirationHandler = handler;
};

export const axiosInterceptorInstance = axios.create({
    baseURL,
    withCredentials: true,
});

axiosInterceptorInstance.interceptors.request.use((config) => {
    const { accessToken, refreshToken } = useAuthStore.getState();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken.replaceAll('"', "")
            }`;
        config.headers["access-token"] = accessToken.replaceAll('"', "");
        if (refreshToken) {
            config.headers["refresh-token"] = refreshToken.replaceAll(
                '"',
                "",
            );
        }
    }
    config.headers["x-foundation-id"] = localStorage.getItem(
        "x-foundation-id",
    );

    return config;
});


// Response Interceptor
axiosInterceptorInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            // No server response - fallback to secondary URL
            axiosInterceptorInstance.defaults.baseURL = fallbackBaseURL;
            console.warn("No response from server - switched to fallback URL");
            return Promise.reject(error);
        }

        // Handle 401 errors (Unauthorized) - Token expired
        if (error.response.status === 401) {
            console.log('🚨 401 Error - Token expired, signing out at:', new Date().toISOString());
            console.log('🚨 Request details:', {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL
            });

            // Call the registered token expiration handler if available
            if (tokenExpirationHandler) {
                console.log('🚨 Calling registered token expiration handler');
                tokenExpirationHandler();
            } else {
                // Fallback: Sign out user when receiving 401
                const { signOut, accessToken } = useAuthStore.getState();

                if (accessToken) {
                    console.log('🚨 Signing out user due to 401 error (fallback)');
                    signOut();
                }
            }
        }

        return Promise.reject(error);
    }
);
export default axiosInterceptorInstance;
