import axios from "axios";
import { BASE_URL } from "./apis-endpoints";

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

        // -------- 401 → force logout --------
        // if (error.response.status === 401) {
        //     localStorage.removeItem("accessToken");
        //     localStorage.removeItem("refreshToken");
        localStorage.removeItem("x-foundation-id");
        sessionStorage.clear();

        //     // 2. Replace current history entry so Back won’t return to the page
        //     window.location.replace(routes.auth.login);

        //     // 3. (Optional) extra guard: if the user still presses Back,
        //     //    immediately send them forward again.
        //     window.onpopstate = () => {
        //         window.location.replace(routes.auth.login);
        //     };
        }

        // return Promise.reject(error);
    // },
);
export default axiosInterceptorInstance;
