import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type { CreateRestaurantDto, UpdateRestaurantDto } from "../models/dtos/restaurant-dto";


export interface WorkingHours {
    opening: string;
    closing: string;
    isActive: boolean;
}

export type WorkingDays = {
    monday: WorkingHours;
    tuesday: WorkingHours;
    wednesday: WorkingHours;
    thursday: WorkingHours;
    friday: WorkingHours;
    saturday: WorkingHours;
    sunday: WorkingHours;

};

export interface CustomLink {
  id: string
  name: string
  value: string
}
export interface Restaurant {
    _id: string;
    name: string;
    slug: string;
    phoneNumber: string;
    email?: string;
    description?: string;
    logo?: string;
    cover?: string;
    locationUrl?: string;
    hours: WorkingDays; // Define `WorkingDays` as needed
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
    hasDineIn?: boolean;
    hasPickup?: boolean;
    // Soft Delete Fields
    deleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    links: CustomLink[];
}

class RestaurantRepository {
    /**
     * Create a new restaurant
     * @param data Restaurant creation data
     * @returns Created restaurant data
     */
    async create(data: CreateRestaurantDto) {
        return await makeRequest<CreateRestaurantDto, Restaurant>({
            method: 'POST',
            url: `${BASE_URL}/restaurants`,
            data,
        });
    }

    /**
     * Retrieve all restaurants
     * @returns List of all restaurants
     */
    async findAll() {
        return await makeRequest<void, unknown>({
            method: 'GET',
            url: `${BASE_URL}/restaurants`,
        });
    }

    /**
     * Retrieve a specific restaurant by ID
     * @param id Restaurant ID
     * @returns Restaurant data
     */
    async findOne(id: string) {
        return await makeRequest<void, Restaurant>({
            method: 'GET',
            url: `${BASE_URL}/restaurants/${id}`,
        });
    }

    /**
     * Update a specific restaurant by ID
     * @param id Restaurant ID
     * @param data Updated restaurant data
     * @returns Updated restaurant data
     */
    async update(id: string, data: UpdateRestaurantDto) {
        return await makeRequest<UpdateRestaurantDto, Restaurant>({
            method: 'PATCH',
            url: `${BASE_URL}/restaurants/${id}`,
            data,
        });
    }

    /**
     * Remove a specific restaurant by ID
     * @param id Restaurant ID
     * @returns Deletion response
     */
    async remove(id: string) {
        return await makeRequest<void, unknown>({
            method: 'DELETE',
            url: `${BASE_URL}/restaurants/${id}`,
        });
    }

    /**
     * Restore a specific restaurant by ID
     * @param id Restaurant ID
     * @returns Restoration response
     */
    async restore(id: string) {
        return await makeRequest<void, unknown>({
            method: 'POST',
            url: `${BASE_URL}/restaurants/${id}/restore`,
        });
    }
}


export const restaurantApi = new RestaurantRepository();
