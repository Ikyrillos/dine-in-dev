# Authentication System Documentation

## Overview

The application now features a robust authentication system with proper token management, user-friendly UX for token expiration, and prevention of automatic logout issues.

## Key Features

### 1. **Proper Token Expiration Handling**
- ✅ No more automatic silent logouts
- ✅ User-friendly dialog when session expires
- ✅ Clear options to re-login or sign out
- ✅ Periodic token validation (every 30 seconds)

### 2. **Improved User Experience**
- ✅ Token expiration dialog with clear messaging
- ✅ Option to sign in again or sign out
- ✅ Prevents data loss by not immediately clearing auth state
- ✅ Professional UI with branded colors and icons

### 3. **Secure Token Management**
- ✅ JWT token validation with expiry checking
- ✅ Automatic cleanup on sign out
- ✅ Foundation ID management
- ✅ Proper localStorage handling

## How It Works

### Token Validation Flow

```
User Login
    ↓
Store Tokens (access + refresh)
    ↓
Start Periodic Validation (30s intervals)
    ↓
Token Valid? → Continue using app
    ↓
Token Expired? → Show Expiration Dialog
    ↓
User Choice:
    - Sign In Again → Clear data & redirect to login
    - Sign Out → Clear data & sign out
```

### API Error Handling

```
API Request → 401 Error
    ↓
Axios Interceptor Catches Error
    ↓
Check if token exists
    ↓
Call Token Expiration Handler
    ↓
Show User-Friendly Dialog
```

## Files Modified

### Core Authentication Files

1. **`src/core/hooks/use-auth.tsx`**
   - Added token expiration dialog state management
   - Implemented periodic token validation
   - Added proper cleanup functions
   - Enhanced error handling

2. **`src/core/axios-config.ts`**
   - Updated response interceptor for 401 errors
   - Added token expiration handler integration
   - Removed automatic logout on 401

3. **`src/core/repositories/auth-repository.ts`**
   - Added refresh token functionality (for future use)
   - Maintained existing login/logout functionality

### UI Components

4. **`src/components/TokenExpirationDialog.tsx`** (New)
   - Professional dialog for token expiration
   - Clear messaging and action buttons
   - Branded styling with primary colors

### Route Protection

5. **`src/routes/index.tsx`**
   - Enhanced beforeLoad to validate token expiry
   - Prevents redirect loops with expired tokens

6. **`src/features/foundations/FoundationsPage.tsx`**
   - Removed automatic logout on 401 errors
   - Let axios interceptor handle token expiration

## Authentication Context API

### Properties

```typescript
interface AuthContextType {
  isAuthenticated: boolean;          // User login status
  user: User | null;                 // Current user data
  isLoading: boolean;                // Auth initialization status
  signIn: (credentials) => Promise<boolean>; // Login function
  signOut: () => void;               // Logout function
  handleTokenExpired: () => void;    // Token expiration handler
  showTokenExpiredDialog: boolean;   // Dialog visibility state
}
```

### Methods

#### `signIn(credentials)`
- Authenticates user with API
- Stores tokens and user data
- Starts periodic token validation
- Returns success boolean

#### `signOut()`
- Clears all authentication data
- Stops token validation
- Resets auth state

#### `handleTokenExpired()`
- Shows token expiration dialog
- Does not immediately clear auth data
- Allows user to choose action

## Token Storage

### LocalStorage Keys
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `UserData` - Serialized user information
- `x-foundation-id` - Selected restaurant/foundation ID

### Token Validation
- Validates JWT expiry time
- Checks token format and structure
- Logs validation results for debugging

## Periodic Token Checking

### Interval: 30 seconds
### Process:
1. Get access token from localStorage
2. Validate token expiry
3. If expired and user is authenticated → show dialog
4. If valid → continue silently

### Cleanup:
- Intervals are cleared on component unmount
- Intervals are cleared when user signs out
- No memory leaks or zombie intervals

## Error Scenarios Handled

### 1. Token Expired
- **Before**: Silent logout, user loses work
- **After**: Dialog shown, user chooses action

### 2. Invalid Token Format
- **Before**: App might crash or behave unexpectedly
- **After**: Graceful handling, user redirected to login

### 3. Network Errors (401)
- **Before**: Automatic logout via axios interceptor
- **After**: User-friendly dialog, no data loss

### 4. Multiple 401 Errors
- **Before**: Multiple logout attempts, confusing UX
- **After**: Single dialog, prevents duplicate handling

## Configuration Options

### Token Check Interval
```typescript
// Current: 30 seconds
const interval = setInterval(() => {
  // Validation logic
}, 30000);

// To change: modify the interval value
// Recommended: 15-60 seconds
```

### Dialog Auto-Close
```typescript
// Currently: Manual user action required
// Future: Could add countdown timer
```

## Usage Examples

### Basic Usage
```typescript
function MyComponent() {
  const { isAuthenticated, user, signIn, signOut } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={signIn} />;
  }

  return (
    <div>
      <h1>Welcome {user?.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Token Expiration Handling
```typescript
function MyApp() {
  const auth = useAuth();

  // The TokenExpirationDialog is automatically rendered
  // No additional code needed - it's handled by AuthProvider

  return (
    <div>
      {auth.isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
}
```

### Manual Token Validation
```typescript
function AdminPanel() {
  const { handleTokenExpired } = useAuth();

  const handleSensitiveAction = () => {
    // For extra security, manually check token before sensitive operations
    const token = localStorage.getItem('accessToken');
    if (token && !isTokenValid(token)) {
      handleTokenExpired();
      return;
    }

    // Proceed with action
  };
}
```

## Best Practices

### 1. **Don't Clear Auth Data Immediately**
- Show dialog first, let user decide
- Prevents accidental data loss
- Better user experience

### 2. **Use Context Methods**
```typescript
// ✅ Good
const { signOut } = useAuth();
signOut();

// ❌ Avoid
localStorage.removeItem('accessToken');
```

### 3. **Handle Loading States**
```typescript
const { isLoading, isAuthenticated } = useAuth();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return <LoginPage />;
}
```

### 4. **Proper Route Protection**
```typescript
// In route definitions
beforeLoad: ({ context }) => {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: "/" });
  }
}
```

## Troubleshooting

### Issue: User Gets Logged Out Randomly
- **Cause**: Token expired, 401 error triggered
- **Solution**: Check token expiry time, ensure proper handling

### Issue: Multiple Dialogs Appearing
- **Cause**: Multiple API calls failing simultaneously
- **Solution**: Dialog state prevents duplicates

### Issue: Token Validation Errors
- **Cause**: Invalid JWT format or corrupted token
- **Solution**: Clear localStorage and re-login

### Issue: Intervals Not Cleaning Up
- **Cause**: Component unmount not handled properly
- **Solution**: Check useEffect cleanup functions

## Future Enhancements

### Automatic Token Refresh
```typescript
// Could be implemented to refresh tokens automatically
const autoRefreshTokens = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    try {
      await refreshTokens();
      return true;
    } catch (error) {
      handleTokenExpired();
      return false;
    }
  }
};
```

### Configurable Intervals
```typescript
// Allow different check intervals per environment
const TOKEN_CHECK_INTERVAL = process.env.NODE_ENV === 'development'
  ? 60000  // 1 minute in dev
  : 30000; // 30 seconds in production
```

### Remember Me Functionality
```typescript
// Extend token lifetime for "remember me" users
const signIn = (credentials, rememberMe = false) => {
  // Implementation would request longer-lived tokens
};
```

### Session Activity Tracking
```typescript
// Track user activity to extend sessions
const trackUserActivity = () => {
  // Update last activity timestamp
  // Refresh token if user is active
};
```

## Security Considerations

1. **Token Storage**: Currently using localStorage (acceptable for this use case)
2. **Token Validation**: Client-side validation for UX, server validates for security
3. **HTTPS**: Ensure all token transmission uses HTTPS
4. **Token Lifetime**: Balance between security and UX
5. **Refresh Token Security**: Store securely, rotate regularly

## Testing Scenarios

### Manual Testing
1. Login → Wait for token expiry → Verify dialog appears
2. Network error → Verify 401 handling works properly
3. Invalid token → Verify graceful degradation
4. Sign out → Verify complete cleanup
5. Multiple tabs → Verify consistent auth state

### Automated Testing
```typescript
// Example test cases
test('shows token expiration dialog on 401', () => {
  // Mock 401 response
  // Verify dialog appears
});

test('cleans up intervals on unmount', () => {
  // Mount component
  // Unmount component
  // Verify no active intervals
});
```

This authentication system now provides a much better user experience with proper token management and no more surprise logouts!