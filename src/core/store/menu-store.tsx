import type { IMenuItem } from "@/core/models/IMenuItem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  menuItem: IMenuItem;
  selectedOptions: { [optionId: string]: string[] };
  quantity: number;
  totalPrice: number;
}

type OrderType = "table" | "pickup";

type MenuStore = {
  // remote data
  categories: { id?: string; name?: string }[];
  menuItems: IMenuItem[];

  // ui state
  searchQuery: string;
  selectedCategory: string; // category id
  cartItems: CartItem[];
  selectedItem: IMenuItem | null;
  currentOptionIndex: number;
  selectedOptions: { [optionId: string]: string[] };
  quantity: number;
  notes: string;
  showConfirmDialog: boolean;
  selectedTable: string | null;
  orderType: OrderType;

  // setters
  setData: (args: {
    categories?: MenuStore["categories"];
    menuItems?: MenuStore["menuItems"];
  }) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (id: string) => void;
  setSelectedItem: (item: IMenuItem | null) => void;
  setShowConfirmDialog: (v: boolean) => void;
  setNotes: (v: string) => void;

  // table / order type
  hydrateOrderContextFromStorage: () => void;
  setOrderType: (t: OrderType) => void;
  setSelectedTable: (t: string | null) => void;

  // item config flow
  startConfigForItem: (item: IMenuItem) => void;
  handleOptionChange: (
    optionId: string,
    choiceId: string,
    checked: boolean
  ) => void;
  canProceed: () => boolean;
  isLastStep: () => boolean;
  currentOption: () => IMenuItem["options"][number] | undefined;
  nextOrAddToCart: () => void;
  incQty: () => void;
  decQty: () => void;

  // cart ops
  calculateItemPrice: (
    item: IMenuItem,
    options: { [optionId: string]: string[] }
  ) => number;
  addToCart: () => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void;
  totalAmount: () => number;
  clearCart: () => void;

  // filtered list
  filteredItems: () => IMenuItem[];
};

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => {
      
      return ({
        categories: [],
        menuItems: [],

        searchQuery: "",
        selectedCategory: "",
        cartItems: [],
        selectedItem: null,
        currentOptionIndex: 0,
        selectedOptions: {},
        quantity: 1,
        notes: "",
        showConfirmDialog: false,
        selectedTable: null,
        orderType: "table",

        setData: (args) => set((s) => ({
          categories: args.categories ?? s.categories,
          menuItems: args.menuItems ?? s.menuItems,
          // if selectedCategory empty and categories arrive, pick first
          selectedCategory: s.selectedCategory ||
            (args.categories?.[0]?.id ? String(args.categories[0].id) : s.selectedCategory),
        })),

        setSearchQuery: (q) => set({ searchQuery: q }),
        setSelectedCategory: (id) => set({ selectedCategory: id, searchQuery: "" }),
        setSelectedItem: (item) => set({ selectedItem: item }),
        setShowConfirmDialog: (v) => set({ showConfirmDialog: v }),
        setNotes: (v) => set({ notes: v }),

        hydrateOrderContextFromStorage: () => {
          const tableNumber = localStorage.getItem("selectedTable");
          const storedType = localStorage.getItem("orderType") as OrderType | null;
          if (storedType === "pickup") {
            set({ orderType: "pickup", selectedTable: null });
          } else if (tableNumber) {
            set({ orderType: "table", selectedTable: tableNumber });
          }
        },
        setOrderType: (t) => {
          localStorage.setItem("orderType", t);
          set({ orderType: t });
          if (t === "pickup") set({ selectedTable: null });
        },
        setSelectedTable: (t) => {
          if (t) localStorage.setItem("selectedTable", t);
          else localStorage.removeItem("selectedTable");
          set({ selectedTable: t });
        },

        startConfigForItem: (item) => set({
          selectedItem: item,
          currentOptionIndex: 0,
          selectedOptions: {},
          quantity: 1,
        }),

        handleOptionChange: (optionId, choiceId, checked) => {
          const item = get().selectedItem;
          const option = item?.options.find((o) => o._id === optionId);
          if (!option) return;

          set((state) => {
            const current = state.selectedOptions[optionId] || [];
            if (option.type === "radio") {
              return {
                selectedOptions: {
                  ...state.selectedOptions,
                  [optionId]: checked ? [choiceId] : [],
                },
              };
            } else {
              return {
                selectedOptions: {
                  ...state.selectedOptions,
                  [optionId]: checked
                    ? [...current, choiceId]
                    : current.filter((id) => id !== choiceId),
                },
              };
            }
          });
        },

        canProceed: () => {
          const item = get().selectedItem;
          const idx = get().currentOptionIndex;
          if (!item) return false;
          const currentOption = item.options[idx];
          if (!currentOption) return true;
          if (currentOption.required) {
            const selected = get().selectedOptions[currentOption._id] || [];
            return selected.length > 0;
          }
          return true;
        },

        isLastStep: () => {
          const item = get().selectedItem;
          if (!item) return false;
          return get().currentOptionIndex === item.options.length - 1;
        },

        currentOption: () => {
          const item = get().selectedItem;
          const idx = get().currentOptionIndex;
          return item?.options[idx];
        },

        nextOrAddToCart: () => {
          const item = get().selectedItem;
          if (!item) return;
          if (get().currentOptionIndex < item.options.length - 1) {
            set((s) => ({ currentOptionIndex: s.currentOptionIndex + 1 }));
          } else {
            get().addToCart();
          }
        },

        incQty: () => set((s) => ({ quantity: s.quantity + 1 })),
        decQty: () => set((s) => ({ quantity: Math.max(1, s.quantity - 1) })),

        calculateItemPrice: (item, options) => {
          let price = item.price;
          item.options.forEach((opt) => {
            const selectedChoiceIds = options[opt._id] || [];
            selectedChoiceIds.forEach((choiceId) => {
              const choice = opt?.choices?.find((c) => c._id === choiceId);
              if (choice) price += choice.price;
            });
          });
          return price;
        },

        addToCart: () => {
          const item = get().selectedItem;
          if (!item) return;
          const options = get().selectedOptions;
          const qty = get().quantity;
          const unit = get().calculateItemPrice(item, options);
          const cartItem: CartItem = {
            id: Date.now().toString(),
            menuItem: item,
            selectedOptions: options,
            quantity: qty,
            totalPrice: unit * qty,
          };
          set((s) => ({
            cartItems: [...s.cartItems, cartItem],
            selectedItem: null, // close modal
          }));
        },

        removeFromCart: (cartItemId) => set((s) => ({
          cartItems: s.cartItems.filter((i) => i.id !== cartItemId),
        })),

        updateCartItemQuantity: (cartItemId, newQuantity) => {
          if (newQuantity === 0) {
            get().removeFromCart(cartItemId);
            return;
          }
          set((s) => ({
            cartItems: s.cartItems.map((i) => i.id === cartItemId
              ? {
                ...i,
                quantity: newQuantity,
                totalPrice: (i.totalPrice / i.quantity) * newQuantity,
              }
              : i
            ),
          }));
        },

        totalAmount: () => get().cartItems.reduce((sum, i) => sum + i.totalPrice, 0),

        clearCart: () => set({ cartItems: [], notes: "" }),

        filteredItems: () => {
          const { menuItems, categories, searchQuery, selectedCategory } = get();
          const searchTerm = searchQuery.toLowerCase().trim();

          const findCategoryName = (catId?: string) => categories.find((c) => String(c.id) === String(catId))?.name?.toLowerCase() || "";

          return menuItems.filter((item) => {
            // search over multiple fields
            const matchesName = item.name.toLowerCase().includes(searchTerm);
            const matchesDescription = item.description?.toLowerCase().includes(searchTerm) || false;
            const matchesCategoryName = findCategoryName(item.category).includes(searchTerm);
            const matchesOptions = item.options?.some((opt) => {
              const optionName = opt.name?.toLowerCase().includes(searchTerm) || false;
              const choiceMatch = opt.choices?.some((ch) => ch.name?.toLowerCase().includes(searchTerm)) || false;
              return optionName || choiceMatch;
            }) || false;

            const matchesSearch = !searchTerm ||
              matchesName ||
              matchesDescription ||
              matchesCategoryName ||
              matchesOptions;

            const matchesCategoryFilter = selectedCategory === "All" || String(item.category) === String(selectedCategory);

            return searchTerm ? matchesSearch : matchesCategoryFilter;
          });
        },
      });
    },
    {
      name: "menu-store", // keep only lightweight stuff; cart and context persist
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        cartItems: s.cartItems,
        notes: s.notes,
        orderType: s.orderType,
        selectedTable: s.selectedTable,
        selectedCategory: s.selectedCategory,
        searchQuery: s.searchQuery,
      }),
    }
  )
);
