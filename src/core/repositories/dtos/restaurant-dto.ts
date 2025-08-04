
export interface CreateRestaurantDto {
    name: string;
    phoneNumber: string;
    email: string;
    description?: string;
    logo?: string;
    cover?: string;
    address: string;
    hours?: {
        [day: string]: {
            opening: string;
            closing: string;
        }
    };
    isActive?: boolean;
    tags?: string[];

}



export type UpdateRestaurantDto = Partial<CreateRestaurantDto>

export interface RestaurantEntity {
    id: string;
    name: string;
    slug: string;
    phoneNumber: string;
    email: string;
    description?: string;
    logo?: string;
    cover?: string;
    address: string;
    isActive: boolean;
    tags: string[];
}