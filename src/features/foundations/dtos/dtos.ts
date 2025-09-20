import type { Restaurant } from "@/core/repositories/restaurant-repository";

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






export interface Foundation {
    _id: string;
    name: string;
    slug: string;
    phoneNumber: string;
    email?: string;
    description?: string;
    logo?: string;
    cover?: string;
    locationUrl?: string;
    // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
    hours: Object;
    address?: string;
    isActive: boolean;
    manager?: string;
    tags: string[];
    stripeAccountId?: string;
    location: {
        lat: number;
        long: number;
    };
    // Restaurant Fees
    commissionRate: number;
    extraDeliveryFee: number;
    adminFee: number;

    // Restaurant Reservation Settings
    averageDiningTimeMs?: number; // Stored in milliseconds
    maxPeoplePerReservation: number;
    reservationTimeInterval: number;

    // Restaurant Ordering Settings
    hasReservation?: boolean;
    hasDelivery?: boolean;
    hasOrder?: boolean;
    hasCollection: boolean;
    minOrderPrice: number;

    // Soft Delete Fields
    deleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}


export interface Delegation {
    _id: string;
    foundation: Restaurant;
    user: string;
    roles: string[];
    permissions: string[];
    deleted: boolean;
}
