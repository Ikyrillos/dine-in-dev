
export interface IMenuCategory {
    id?: string;
    name: string;
    description?: string;
    photoUrl?: string;
    position?: number;

    // Soft Delete Properties
    deleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}