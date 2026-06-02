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

const KEY = "dunnkayce_state_v2";

const F = (name: string, price: number, image: string, description: string, extra: Partial<Food> = {}): Food => ({
  id: "f_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name, price, image, description, category: "Foods", status: "Available", dailyLimit: 10, ...extra,
});
const P = (name: string, price: number, image: string, description: string): Food => ({
  id: "p_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name, price, image, description, category: "Protein", status: "Available", dailyLimit: 3,
});

const seedFoods: Food[] = [
  // FOODS
  F("Jollof Rice", 400, "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600", "Smoky party-style jollof rice."),
  F("Fried Rice", 400, "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600", "Veggie-packed Nigerian fried rice."),
  F("White Spaghetti", 450, "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600", "Boiled spaghetti tossed with seasoning."),
  F("Jollof Spaghetti", 450, "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600", "Spaghetti cooked in rich tomato base."),
  F("White Beans", 450, "https://images.unsplash.com/photo-1612257999691-c4d7ac4ad5d8?w=600", "Soft-cooked white beans."),
  F("Mashed Beans", 450, "https://images.unsplash.com/photo-1547496502-affa22d38842?w=600", "Creamy mashed beans with peppers."),
  F("Plantain", 500, "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=600", "Sweet ripe fried plantain."),
  F("Potato Chips", 500, "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600", "Golden hand-cut potato chips."),
  F("Eba", 500, "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600", "Garri swallow — pick your soup.", { isSwallow: true }),
  F("Semo", 500, "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600", "Smooth semolina swallow — pick your soup.", { isSwallow: true }),

  // PROTEIN
  P("Fried Fish", 1000, "https://images.unsplash.com/photo-1535140728149-1c84e2f04300?w=600", "Crispy fried titus fish."),
  P("Kote Fish", 1000, "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600", "Seasoned kote (mackerel) fish."),
  P("Peppered Fish", 1200, "https://images.unsplash.com/photo-1604908554049-01ed1335fb9e?w=600", "Fish smothered in spicy pepper sauce."),
  P("Chicken (Small)", 1000, "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600", "Small portion fried chicken."),
  P("Chicken (Medium)", 1500, "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600", "Medium portion fried chicken."),
  P("Ponmo", 500, "https://images.unsplash.com/photo-1606851094291-6efae152bb87?w=600", "Tender cow-skin ponmo."),
  P("Egg", 300, "https://images.unsplash.com/photo-1607690424560-35d967d6ad7f?w=600", "Boiled or fried egg."),
  P("Gizzard", 300, "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f9e?w=600", "Peppered chicken gizzard."),
  P("Chicken (Large)", 2000, "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600", "Large portion fried chicken."),
  P("Roasted Chicken", 2500, "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600", "Charcoal-roasted chicken."),
  P("Roasted Turkey", 2500, "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600", "Smoky roasted turkey wing."),
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
  // Per-person daily total for a food (today). If userId omitted, uses current user.
  todayOrderedQty(foodId: string, userId?: string): number {
    const uid = userId ?? state.currentUserId;
    if (!uid) return 0;
    const today = new Date().toDateString();
    return state.orders
      .filter((o) => o.userId === uid && new Date(o.createdAt).toDateString() === today && o.paymentStatus !== "Failed" && o.paymentStatus !== "Rejected")
      .flatMap((o) => o.items)
      .filter((i) => i.foodId === foodId)
      .reduce((sum, i) => sum + i.qty, 0);
  },
  createOrder(data: { hostel: string; room: string; paymentMethod: PaymentMethod }): Order | { error: string } {
    const u = store.currentUser();
    if (!u) return { error: "Not logged in" };
    if (state.cart.length === 0) return { error: "Cart is empty" };

    // Validate per-person daily limits
    for (const c of state.cart) {
      const food = state.foods.find((f) => f.id === c.foodId);
      if (!food) return { error: "Food not found" };
      if (food.status !== "Available") return { error: `${food.name} is ${food.status}` };
      const ordered = store.todayOrderedQty(food.id, u.id);
      if (ordered + c.qty > food.dailyLimit) {
        return { error: `${food.name}: you can only order ${food.dailyLimit}/day. ${Math.max(0, food.dailyLimit - ordered)} left for you today.` };
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
