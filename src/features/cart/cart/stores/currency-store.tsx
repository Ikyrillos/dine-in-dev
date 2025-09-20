import { create } from 'zustand';

type CurrencyState = {
  region: string;
  currencySymbol: string;
  setRegion: (region: string) => void;
  determineRegionFromCoordinates: (latitude: number, longitude: number) => void;
};

export const useCurrencyStore = create<CurrencyState>((set) => ({
  region: 'EU', // Default region
  currencySymbol: '£', // Default currency symbol
  setRegion: (region) =>
    set(() => {

      // const symbols: Record<string, string> = {
      //   EU: '€',
      //   JP: '¥',
      //   UK: '£',
      //   SA: 'ر.س', // Saudi Riyal
      //   KW: 'د.ك', // Kuwaiti Dinar
      //   EG: 'E£', // Egyptian Pound
      //   ME: 'د.إ', // Dirham (Middle East region default, can be UAE Dirham)
      //   US: '$',
      // };

      return {
        region,
        currencySymbol: '£', // Default to '€' if region is not in symbols
      };
    }),
  determineRegionFromCoordinates: (latitude, longitude) => {
    let detectedRegion = 'US'; // Default to US if no match

    if (longitude >= -10 && longitude <= 40 && latitude >= 35 && latitude <= 70) {
      detectedRegion = 'EU'; // Europe
    } else if (longitude >= 120 && longitude <= 150 && latitude >= 20 && latitude <= 50) {
      detectedRegion = 'JP'; // Japan
    } else if (longitude >= -10 && longitude <= 0 && latitude >= 50 && latitude <= 60) {
      detectedRegion = 'UK'; // United Kingdom
    } else if (longitude >= 35 && longitude <= 50 && latitude >= 20 && latitude <= 30) {
      detectedRegion = 'SA'; // Saudi Arabia
    } else if (longitude >= 46 && longitude <= 48 && latitude >= 28 && latitude <= 30) {
      detectedRegion = 'KW'; // Kuwait
    } else if (longitude >= 25 && longitude <= 35 && latitude >= 22 && latitude <= 31) {
      detectedRegion = 'EG'; // Egypt
    } else if (longitude >= 25 && longitude <= 60 && latitude >= 12 && latitude <= 40) {
      detectedRegion = 'ME'; // General Middle East region
    }

    // const symbols: Record<string, string> = {
    //   EU: '€',
    //   JP: '¥',
    //   UK: '£',
    //   SA: 'ر.س', // Saudi Riyal
    //   KW: 'د.ك', // Kuwaiti Dinar
    //   EG: 'E£', // Egyptian Pound
    //   ME: 'د.إ', // Dirham (Middle East default)
    //   US: '$',
    // };

    set(() => ({
      region: detectedRegion,
      currencySymbol: '£',
    }));
  },
}));
