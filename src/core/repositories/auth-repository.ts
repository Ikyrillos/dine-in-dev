
import type { Delegation } from '@/features/foundations/dtos/dtos';
import { BASE_URL } from '../apis-endpoints';
import { makeRequest } from '../make-request';
import type { LoginDto, LoginResponse, LogoutResponse, RegisterDto, RegisterResponse, User } from '../models/dtos/dtos';

class AuthService {
    /**
     * Authenticate user and log in
     * @param credentials User login credentials
     * @returns User authentication data
     */
    async login(credentials: LoginDto) {
        return await makeRequest<LoginDto, LoginResponse>({
            method: 'POST',
            url: `${BASE_URL}/auth/login`,
            data: credentials,
            withCredentials: true
        });
    }

    /**
     * Register a new user
     * @param userData User registration data
     * @returns Registration response
     */
    async register(userData: RegisterDto) {
        return await makeRequest<RegisterDto, RegisterResponse>({
            method: 'POST',
            url: `${BASE_URL}/auth/register`,
            data: userData,
            withCredentials: true
        });
    }

    /**
     * Fetch current authenticated user's information
     * @param token Authentication token
     * @returns User information
     */
    async getCurrentUser(token: string) {
        return await makeRequest<void, User>({
            method: 'GET',
            url: `${BASE_URL}/auth/me`,
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
    }


    /**
     * Log out the current user
     * @returns Logout response
     */
    async logout() {
        return await makeRequest<void, LogoutResponse>({
            method: 'POST',
            url: `${BASE_URL}/auth/logout`,
            withCredentials: true
        });
    }

    /**
     * Initiate password recovery process
     * @param email User's email address
     * @returns Password recovery response
     */
    async forgotPassword(email: string) {
        return await makeRequest<{ email: string }, unknown>({
            method: 'POST',
            url: `${BASE_URL}/auth/forgot-password`,
            data: { email },
            withCredentials: true
        });
    }

    /**
     * Initiate Google OAuth authentication
     * Redirects user to Google login page
     */
    initiateGoogleAuth() {
        // This will redirect the user to Google's auth page
        window.location.href = `https://api.tawila.co.uk/auth/google/callback?redirect_url=restaurant-app-ttva.vercel.app`;
    }

    async getUserDelegations(userId: string) {
        return await makeRequest<void, Delegation[]>({
            method: 'GET',
            url: `${BASE_URL}/delegations/user/${userId}`,
            withCredentials: true,
        });
    }

}

export const authApi = new AuthService();