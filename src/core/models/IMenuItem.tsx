

export interface IChoice {
    _id: string;
    name: string;
    price: number;
    description?: string;
    calories?: number;
    isActive: boolean;
}

export interface IOption {
    _id: string;
    name: string;
    displayName?: string;
    price: number;
    required: boolean;
    selectionLimit: number;
    type: 'radio' | 'checkbox';
    choices?: IChoice[];
}

export interface IMenuItem {
      _id: string;
    menu: string;
    options: IOption[];
    category?: string;
    name: string;
    displayName?: string;
    description?: string;
    price: number;
    photoUrl?: string;
    calories?: number;
    spicyLevel?: number;
    position?: number;
    isActive?: boolean;
    isPopular?: boolean;
    deleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

