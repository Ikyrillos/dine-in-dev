# Environment Configuration Guide

## Overview

The application now uses flexible environment variables that work with Vercel's deployment system to automatically switch between development and production APIs.

## Environment Variables

### Core Configuration

| Variable | Description | Development Value | Production Value |
|----------|-------------|-------------------|------------------|
| `VITE_APP_ENV` | Environment identifier | `development` | `production` |
| `VITE_DEV_API_URL` | Development API URL | `https://api-dev.tawila.co.uk` | - |
| `VITE_PROD_API_URL` | Production API URL | - | `https://api.tawila.co.uk` |
| `VITE_DEV_RESTAURANT_ID` | Development Restaurant ID | `674b5cdfd4f15cf44da5c090` | - |
| `VITE_PROD_RESTAURANT_ID` | Production Restaurant ID | - | `67cadca16c210077db259e7c` |

## How It Works

### Environment Detection Priority
1. `VITE_APP_ENV` (Vercel environment variable)
2. `process.env.NODE_ENV` (Node.js environment)
3. `"development"` (fallback)

### URL Selection Logic
```typescript
// Development
if (APP_ENV === "development") {
  BASE_URL = VITE_DEV_API_URL || "https://api-dev.tawila.co.uk"
  RESTAURANT_ID = VITE_DEV_RESTAURANT_ID || "674b5cdfd4f15cf44da5c090"
}

// Production
else {
  BASE_URL = VITE_PROD_API_URL || "https://api.tawila.co.uk"
  RESTAURANT_ID = VITE_PROD_RESTAURANT_ID || "67cadca16c210077db259e7c"
}
```

## Vercel Deployment Setup

### 1. Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

#### Development Environment
```bash
VITE_APP_ENV=development
VITE_DEV_API_URL=https://api-dev.tawila.co.uk
VITE_DEV_RESTAURANT_ID=674b5cdfd4f15cf44da5c090
```

#### Preview Environment
```bash
VITE_APP_ENV=development
VITE_DEV_API_URL=https://api-dev.tawila.co.uk
VITE_DEV_RESTAURANT_ID=674b5cdfd4f15cf44da5c090
```

#### Production Environment
```bash
VITE_APP_ENV=production
VITE_PROD_API_URL=https://api.tawila.co.uk
VITE_PROD_RESTAURANT_ID=67cadca16c210077db259e7c
```

### 2. Vercel CLI Setup (Alternative)

Create environment-specific `.env` files:

#### `.env.development`
```bash
VITE_APP_ENV=development
VITE_DEV_API_URL=https://api-dev.tawila.co.uk
VITE_DEV_RESTAURANT_ID=674b5cdfd4f15cf44da5c090
```

#### `.env.production`
```bash
VITE_APP_ENV=production
VITE_PROD_API_URL=https://api.tawila.co.uk
VITE_PROD_RESTAURANT_ID=67cadca16c210077db259e7c
```

Then use Vercel CLI:
```bash
vercel env pull .env.local
```

## Local Development

### Current `.env` File
Your local `.env` file is set to development:
```bash
VITE_APP_ENV=development
VITE_DEV_API_URL=https://api-dev.tawila.co.uk
VITE_DEV_RESTAURANT_ID=674b5cdfd4f15cf44da5c090
```

### Testing Production Locally
To test production configuration locally:
```bash
VITE_APP_ENV=production npm run dev
```

Or temporarily change `.env`:
```bash
VITE_APP_ENV=production
```

## Debugging

### Console Output
The application logs the current configuration:
```
🌍 Environment: development
🔗 API Base URL: https://api-dev.tawila.co.uk
🏪 Restaurant ID: 674b5cdfd4f15cf44da5c090
```

### Troubleshooting

#### Issue: Wrong API being used
- Check Vercel environment variables
- Verify `VITE_APP_ENV` is set correctly
- Check browser console for environment logs

#### Issue: Environment variables not loading
- Ensure variables start with `VITE_` prefix
- Restart development server after changes
- Check Vercel deployment logs

#### Issue: Restaurant ID mismatch
- Verify correct IDs are set for each environment
- Check API responses match expected restaurant

## Branch-based Deployments

### Automatic Environment Detection
```bash
# main branch → production
VITE_APP_ENV=production

# develop branch → development
VITE_APP_ENV=development

# feature branches → development
VITE_APP_ENV=development
```

### Vercel Configuration
In `vercel.json`:
```json
{
  "env": {
    "VITE_APP_ENV": "production"
  },
  "build": {
    "env": {
      "VITE_APP_ENV": "production"
    }
  }
}
```

## Advanced Configuration

### Multiple Environments
You can add staging environment:
```bash
# Staging
VITE_APP_ENV=staging
VITE_STAGING_API_URL=https://api-staging.tawila.co.uk
VITE_STAGING_RESTAURANT_ID=staging-id-here
```

Then update `apis-endpoints.ts`:
```typescript
export const BASE_URL =
  APP_ENV === "production" ? VITE_PROD_API_URL :
  APP_ENV === "staging" ? VITE_STAGING_API_URL :
  VITE_DEV_API_URL || "https://api-dev.tawila.co.uk";
```

### Environment-specific Features
```typescript
// Enable debug features in development
export const DEBUG_MODE = APP_ENV === "development";
export const ENABLE_LOGS = APP_ENV !== "production";

// Different timeout values
export const API_TIMEOUT = APP_ENV === "production" ? 10000 : 30000;
```

## Security Considerations

### Environment Variable Exposure
- All `VITE_` variables are exposed to the browser
- Don't put secrets in `VITE_` variables
- Use server-side environment variables for sensitive data

### API Keys and Secrets
For sensitive data, use Vercel's edge functions or API routes:
```typescript
// pages/api/config.ts
export default function handler(req, res) {
  res.json({
    apiUrl: process.env.SECRET_API_URL, // Not exposed to browser
  });
}
```

## Migration from Current Setup

### Before
```typescript
export const BASE_URL = process.env.NODE_ENV === "development"
  ? "https://api-dev.tawila.co.uk"
  : "https://api.tawila.co.uk";
```

### After
```typescript
const APP_ENV = import.meta.env.VITE_APP_ENV || process.env.NODE_ENV || "development";

export const BASE_URL = APP_ENV === "development"
  ? (import.meta.env.VITE_DEV_API_URL || "https://api-dev.tawila.co.uk")
  : (import.meta.env.VITE_PROD_API_URL || "https://api.tawila.co.uk");
```

### Benefits
- ✅ Explicit environment control via `VITE_APP_ENV`
- ✅ Fallback values for safety
- ✅ Easy to override URLs per environment
- ✅ Better debugging with console logs
- ✅ Flexible for multiple environments

## Testing

### Manual Testing
1. Set `VITE_APP_ENV=development` → Should use dev API
2. Set `VITE_APP_ENV=production` → Should use prod API
3. Check browser console for configuration logs
4. Verify API calls go to correct endpoints

### Automated Testing
```typescript
describe('Environment Configuration', () => {
  it('should use development API in dev environment', () => {
    process.env.VITE_APP_ENV = 'development';
    // Test BASE_URL equals dev URL
  });

  it('should use production API in prod environment', () => {
    process.env.VITE_APP_ENV = 'production';
    // Test BASE_URL equals prod URL
  });
});
```

This setup provides maximum flexibility for managing different environments in Vercel while maintaining backward compatibility!