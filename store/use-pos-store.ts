import { create } from 'zustand';

export interface CartItem {
  id: string; // unique id for the cart item (e.g. uuid)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: { id: string; name: string; price: number }[];
}

interface PosState {
  selectedTableId: string | null;
  cart: CartItem[];
  setSelectedTableId: (id: string | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>((set) => ({
  selectedTableId: null,
  cart: [],
  setSelectedTableId: (id) => set({ selectedTableId: id }),
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (i) =>
          i.productId === item.productId &&
          i.notes === item.notes &&
          JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
      );
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),
  removeFromCart: (id) =>
    set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      cart: state.cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ cart: [] }),
}));
