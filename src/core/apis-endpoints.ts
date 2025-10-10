// Environment-based API configuration
// Uses VITE_APP_ENV for Vercel deployment environments
const APP_ENV = import.meta.env.VITE_APP_ENV || "production";

export const BASE_URL =
    // APP_ENV === "development"
    // ? "https://api-dev.tawila.co.uk"
    // :

    "https://api.tawila.co.uk";

// export const RESTAURANT_ID = APP_ENV === "development"
//   ? (import.meta.env.VITE_DEV_RESTAURANT_ID || "674b5cdfd4f15cf44da5c090")
//   : (import.meta.env.VITE_PROD_RESTAURANT_ID || "67cadca16c210077db259e7c");

// Log current configuration for debugging
console.log(`🌍 Environment: ${APP_ENV}`);
console.log(`🔗 API Base URL: ${BASE_URL}`);
// console.log(`🏪 Restaurant ID: ${RESTAURANT_ID}`);
