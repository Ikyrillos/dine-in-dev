
export interface LoginDto {
    identifier: string; // email or phone number
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export interface UserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    status?: string;
}

export interface TokensDto {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
}

export interface PasswordUpdateDto {
    oldPassword: string;
    newPassword: string;
}

// User interface to represent the user object
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status: 'active' | 'inactive'; // Using union type for status
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface LogoutResponse {
    message: string;
}
// Main LoginResponse interface
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RegisterResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

