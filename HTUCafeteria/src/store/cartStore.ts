import { create } from 'zustand';
import type { MenuItem } from '@/constants/data';

export interface CartItem {
  id: string;
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (food: MenuItem, quantity?: number) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  updateNotes: (foodId: string, notes: string) => void;
  clearCart: () => void;
  getItem: (foodId: string) => CartItem | undefined;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (food, quantity = 1) => {
    const existing = get().items.find((i) => i.foodId === food.id);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.foodId === food.id ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      set({
        items: [
          ...get().items,
          {
            id: `${Date.now()}`,
            foodId: food.id,
            name: food.name,
            price: food.price,
            quantity,
            image: food.image,
          },
        ],
      });
    }
  },

  removeItem: (foodId) =>
    set({ items: get().items.filter((i) => i.foodId !== foodId) }),

  updateQuantity: (foodId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.foodId !== foodId) });
    } else {
      set({
        items: get().items.map((i) =>
          i.foodId === foodId ? { ...i, quantity } : i
        ),
      });
    }
  },

  updateNotes: (foodId, notes) =>
    set({
      items: get().items.map((i) =>
        i.foodId === foodId ? { ...i, notes } : i
      ),
    }),

  clearCart: () => set({ items: [] }),

  getItem: (foodId) => get().items.find((i) => i.foodId === foodId),

  totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

  totalPrice: () =>
    get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
}));
