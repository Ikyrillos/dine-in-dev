// Utility functions for storing and retrieving discount and notes per table

interface TableCheckoutData {
  discount: number;
  notes: string;
}

const STORAGE_KEY = 'table-checkout-data';

// Get checkout data for a specific table
export function getTableCheckoutData(tableId: string): TableCheckoutData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { discount: 0, notes: '' };

    const allData = JSON.parse(stored);
    return allData[tableId] || { discount: 0, notes: '' };
  } catch (error) {
    console.error('Error reading table checkout data:', error);
    return { discount: 0, notes: '' };
  }
}

// Store checkout data for a specific table
export function setTableCheckoutData(tableId: string, data: TableCheckoutData): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allData = stored ? JSON.parse(stored) : {};

    allData[tableId] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error('Error storing table checkout data:', error);
  }
}

// Clear checkout data for a specific table (after successful payment)
export function clearTableCheckoutData(tableId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allData = JSON.parse(stored);
    delete allData[tableId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error('Error clearing table checkout data:', error);
  }
}

// Get all stored table checkout data (for debugging/cleanup)
export function getAllTableCheckoutData(): Record<string, TableCheckoutData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading all table checkout data:', error);
    return {};
  }
}