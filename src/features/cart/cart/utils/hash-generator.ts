export interface SelectedOptionDto {
  optionId: string;
  choiceIds: string[];
}

// Simple hash function for browser compatibility
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString(16);

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

// Browser-compatible hash generator using Web Crypto API fallback to simple hash
export async function generateOptionsHashAsync(
  menuItemId: string,
  selectedOptions: SelectedOptionDto[] = [],
): Promise<string> {
  const sortedOptions = selectedOptions
    .map((opt) => ({
      optionId: opt.optionId.toString(),
      choiceIds: opt.choiceIds.map((id) => id.toString()).sort(),
    }))
    .sort((a, b) => a.optionId.localeCompare(b.optionId));

  const dataToHash = JSON.stringify({ ...sortedOptions, menuItemId });

  // Try to use Web Crypto API if available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(dataToHash);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    } catch (error) {
      console.warn('Web Crypto API failed, falling back to simple hash:', error);
    }
  }

  // Fallback to simple hash
  return simpleHash(dataToHash);
}

// Synchronous version for immediate use (less secure but browser compatible)
export function generateOptionsHash(
  menuItemId: string,
  selectedOptions: SelectedOptionDto[] = [],
): string {
  const sortedOptions = selectedOptions
    .map((opt) => ({
      optionId: opt.optionId.toString(),
      choiceIds: opt.choiceIds.map((id) => id.toString()).sort(),
    }))
    .sort((a, b) => a.optionId.localeCompare(b.optionId));

  const dataToHash = JSON.stringify({ ...sortedOptions, menuItemId });
  return simpleHash(dataToHash);
}