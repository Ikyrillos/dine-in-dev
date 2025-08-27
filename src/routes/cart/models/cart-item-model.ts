import type { IMenuItem, IOption } from "@/core/models/IMenuItem";


export interface ISelectedOption {
    optionId: string;
    choiceIds: string[];
}

export interface ICartItem {
    _id: string;
    menuItem: IMenuItem; // Changed from string to IMenuItem
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedOptions: ISelectedOption[];
    optionsHash: string;
    createdAt: string;
    updatedAt: string;
}

export interface ICart {
    _id: string;
    user: string;
    foundation: string;
    items: ICartItem[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export function getSelectedChoiceNamesForItem(cartItem: ICartItem): string[] {
    const selectedChoices: string[] = [];

    const menuItem = cartItem.menuItem;
    const optionsMap: Record<string, IOption> = {};

    // Create a map of optionId to options
    menuItem.options.forEach((option) => {
        optionsMap[option._id] = option;
    });

    // Iterate over selected options
    cartItem.selectedOptions.forEach((selectedOption) => {
        const option = optionsMap[selectedOption.optionId];
        if (option) {
            const choiceMap: Record<string, string> = {};

            // Create a map of choiceId to choice name
            option.choices?.forEach((choice) => {
                choiceMap[choice._id] = choice.name;
            });

            // Retrieve selected choice names
            selectedOption.choiceIds.forEach((choiceId) => {
                if (choiceMap[choiceId]) {
                    selectedChoices.push(choiceMap[choiceId]);
                }
            });
        }
    });

    return selectedChoices;
}