import axios from "axios";
import { BASE_URL } from "./apis-endpoints";

// Global reference to handle token expiration
let handleTokenExpiration: (() => void) | null = null;

// Function to set the token expiration handler
export const setTokenExpirationHandler = (handler: () => void) => {
    handleTokenExpiration = handler;
};

const baseURL = BASE_URL;
const fallbackBaseURL = BASE_URL;

export const axiosInterceptorInstance = axios.create({
    baseURL,
    withCredentials: true,
});

axiosInterceptorInstance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

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
            console.log('🚨 401 Error - Token expired, triggering token expiration handler');

            // Only handle token expiration if we have a handler and there's an access token
            const accessToken = localStorage.getItem("accessToken");
            if (handleTokenExpiration && accessToken) {
                // Call the token expiration handler (shows dialog instead of auto-logout)
                handleTokenExpiration();
            }
        }

        return Promise.reject(error);
    }
);
export default axiosInterceptorInstance;
