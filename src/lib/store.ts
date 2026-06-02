// Simple localStorage-backed data store. No backend.
import { useSyncExternalStore } from "react";

export type Category = "Foods" | "Protein";
export type Status = "Available" | "Not available" | "Preparing";
export type SoupType = "Egusi" | "Okra" | "Vegetable";
export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Delivered";
export type PaymentMethod = "Paystack" | "Moniepoint";
export type PaymentStatus = "Paid" | "Pending" | "Failed" | "Rejected";

export interface Food {
  id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  category: Category;
  status: Status;
  isSwallow?: boolean;
  soupType?: SoupType;
  dailyLimit: number; // 10 for Foods, 3 for Protein
}

export interface CartItem {
  foodId: string;
  qty: number;
  soupType?: SoupType;
}

export interface Order {
  id: string;
  userId: string;
  items: { foodId: string; name: string; qty: number; price: number; soupType?: SoupType }[];
  total: number;
  hostel: string;
  room: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string; // ISO
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
  role: "user" | "admin";
}

interface State {
  users: User[];
  foods: Food[];
  orders: Order[];
  cart: CartItem[];
  currentUserId: string | null;
}

const KEY = "dunnkayce_state_v1";

const seedFoods: Food[] = [
  { id: "f1", name: "Jollof Rice", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600", price: 1500, description: "Smoky party-style jollof with stew base.", category: "Foods", status: "Available", dailyLimit: 10 },
  { id: "f2", name: "Spaghetti Bolognese", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600", price: 1800, description: "Spaghetti tossed in rich tomato meat sauce.", category: "Foods", status: "Available", dailyLimit: 10 },
  { id: "f3", name: "Swallow", image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600", price: 2000, description: "Pounded yam served with a soup of your choice.", category: "Foods", status: "Available", isSwallow: true, dailyLimit: 10 },
  { id: "p1", name: "Grilled Chicken", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600", price: 2500, description: "Charcoal-grilled chicken with spices.", category: "Protein", status: "Available", dailyLimit: 3 },
  { id: "p2", name: "Fried Fish", image: "https://images.unsplash.com/photo-1535400255456-7b7c4b6f5b5b?w=600", price: 2200, description: "Crispy croaker fish, deep fried.", category: "Protein", status: "Available", dailyLimit: 3 },
  { id: "p3", name: "Beef", image: "https://images.unsplash.com/photo-1606851094291-6efae152bb87?w=600", price: 1500, description: "Tender boiled & fried beef chunks.", category: "Protein", status: "Available", dailyLimit: 3 },
  { id: "p4", name: "Boiled Egg", image: "https://images.unsplash.com/photo-1607690424560-35d967d6ad7f?w=600", price: 500, description: "Classic boiled egg.", category: "Protein", status: "Available", dailyLimit: 3 },
];

const seedUsers: User[] = [
  { id: "admin", fullName: "Admin", email: "admin@dunnkayce.com", phone: "08000000000", gender: "Other", password: "admin123", role: "admin" },
  { id: "u1", fullName: "Demo Student", email: "student@dunnkayce.com", phone: "08011112222", gender: "Male", password: "student123", role: "user" },
];

const initial: State = {
  users: seedUsers,
  foods: seedFoods,
  orders: [],
  cart: [],
  currentUserId: null,
};

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

function set(updater: (s: State) => State) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  // auth
  login(email: string, password: string): User | null {
    const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (u) set((s) => ({ ...s, currentUserId: u.id, cart: [] }));
    return u ?? null;
  },
  signup(data: Omit<User, "id" | "role">): User | null {
    if (state.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) return null;
    const u: User = { ...data, id: "u" + Date.now(), role: "user" };
    set((s) => ({ ...s, users: [...s.users, u], currentUserId: u.id, cart: [] }));
    return u;
  },
  logout() { set((s) => ({ ...s, currentUserId: null, cart: [] })); },
  currentUser(): User | null {
    return state.users.find((u) => u.id === state.currentUserId) ?? null;
  },
  updateProfile(patch: Partial<User>) {
    set((s) => ({ ...s, users: s.users.map((u) => u.id === s.currentUserId ? { ...u, ...patch } : u) }));
  },
  changePassword(oldPw: string, newPw: string): boolean {
    const u = store.currentUser();
    if (!u || u.password !== oldPw) return false;
    store.updateProfile({ password: newPw });
    return true;
  },

  // foods
  addFood(f: Omit<Food, "id">) {
    set((s) => ({ ...s, foods: [...s.foods, { ...f, id: "f" + Date.now() }] }));
  },
  updateFood(id: string, patch: Partial<Food>) {
    set((s) => ({ ...s, foods: s.foods.map((f) => f.id === id ? { ...f, ...patch } : f) }));
  },
  deleteFood(id: string) {
    set((s) => ({ ...s, foods: s.foods.filter((f) => f.id !== id) }));
  },

  // cart
  addToCart(foodId: string, qty = 1, soupType?: SoupType) {
    set((s) => {
      const existing = s.cart.find((c) => c.foodId === foodId && c.soupType === soupType);
      const cart = existing
        ? s.cart.map((c) => c === existing ? { ...c, qty: c.qty + qty } : c)
        : [...s.cart, { foodId, qty, soupType }];
      return { ...s, cart };
    });
  },
  updateCartQty(foodId: string, qty: number, soupType?: SoupType) {
    set((s) => ({
      ...s,
      cart: qty <= 0
        ? s.cart.filter((c) => !(c.foodId === foodId && c.soupType === soupType))
        : s.cart.map((c) => c.foodId === foodId && c.soupType === soupType ? { ...c, qty } : c),
    }));
  },
  clearCart() { set((s) => ({ ...s, cart: [] })); },

  // orders
  todayOrderedQty(foodId: string): number {
    const today = new Date().toDateString();
    return state.orders
      .filter((o) => new Date(o.createdAt).toDateString() === today && o.paymentStatus !== "Failed" && o.paymentStatus !== "Rejected")
      .flatMap((o) => o.items)
      .filter((i) => i.foodId === foodId)
      .reduce((sum, i) => sum + i.qty, 0);
  },
  createOrder(data: { hostel: string; room: string; paymentMethod: PaymentMethod }): Order | { error: string } {
    const u = store.currentUser();
    if (!u) return { error: "Not logged in" };
    if (state.cart.length === 0) return { error: "Cart is empty" };

    // Validate daily limits
    for (const c of state.cart) {
      const food = state.foods.find((f) => f.id === c.foodId);
      if (!food) return { error: "Food not found" };
      if (food.status !== "Available") return { error: `${food.name} is ${food.status}` };
      const ordered = store.todayOrderedQty(food.id);
      if (ordered + c.qty > food.dailyLimit) {
        return { error: `${food.name} daily limit reached (${food.dailyLimit}/day). Only ${Math.max(0, food.dailyLimit - ordered)} left today.` };
      }
    }

    const items = state.cart.map((c) => {
      const f = state.foods.find((x) => x.id === c.foodId)!;
      return { foodId: f.id, name: f.name + (c.soupType ? ` (${c.soupType})` : ""), qty: c.qty, price: f.price, soupType: c.soupType };
    });
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const order: Order = {
      id: "o" + Date.now(),
      userId: u.id,
      items,
      total,
      hostel: data.hostel,
      room: data.room,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "Paystack" ? "Paid" : "Pending",
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ ...s, orders: [order, ...s.orders], cart: [] }));
    return order;
  },
  updateOrderStatus(id: string, status: OrderStatus) {
    set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, status } : o) }));
  },
  updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, paymentStatus } : o) }));
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => selector(store.get()),
    () => selector(initial),
  );
}

export function formatNGN(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}
