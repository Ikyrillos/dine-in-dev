// Test file to verify the implementation
import { menuCategoryApi } from './src/core/repositories/categories-repository';
import { useGetMenuCategoriesByMenu } from './src/core/hooks/get-categories-hooks';

// Test the API method
console.log('Testing fetchMenuCategories method:', menuCategoryApi.fetchMenuCategories);

// Test the hook
console.log('Testing useGetMenuCategoriesByMenu hook:', useGetMenuCategoriesByMenu);

// Example usage:
// const restaurant = { dineInMenu: 'menu-id-123' };
// const { data, isLoading, error } = useGetMenuCategoriesByMenu(restaurant.dineInMenu);