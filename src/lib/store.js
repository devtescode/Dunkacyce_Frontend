// Simple localStorage-backed data store. No backend.
import { useSyncExternalStore } from "react";
export const DELIVERY_FEE = 100;
export const HOSTELS = ["MH1", "MH2", "FH1", "FH2", "FH3"];
const KEY = "dunnkayce_state_v3";
const F = (name, price, image, description, extra = {}) => ({
    id: "f_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    name, price, image, description, category: "Foods", status: "Available", dailyLimit: 10, ...extra,
});
const P = (name, price, image, description) => ({
    id: "p_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    name, price, image, description, category: "Protein", status: "Available", dailyLimit: 3,
});
const seedFoods = [
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
const seedUsers = [
    { id: "admin", fullName: "Admin", email: "admin@dunnkayce.com", phone: "08000000000", gender: "Other", password: "admin123", role: "admin" },
    { id: "u1", fullName: "Demo Student", email: "student@dunnkayce.com", phone: "08011112222", gender: "Male", password: "student123", role: "user" },
];
const initial = {
    users: seedUsers,
    foods: seedFoods,
    orders: [],
    cart: [],
    currentUserId: null,
};
let state = load();
const listeners = new Set();
function normalizeState(parsed) {
    if (!parsed || typeof parsed !== "object") {
        return initial;
    }
    return {
        ...initial,
        ...parsed,
        users: Array.isArray(parsed.users) ? parsed.users : initial.users,
        foods: Array.isArray(parsed.foods) ? parsed.foods : initial.foods,
        orders: Array.isArray(parsed.orders) ? parsed.orders : initial.orders,
        cart: Array.isArray(parsed.cart) ? parsed.cart : initial.cart,
        currentUserId: typeof parsed.currentUserId === "string" ? parsed.currentUserId : initial.currentUserId,
    };
}
function load() {
    if (typeof window === "undefined")
        return initial;
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return initial;
        return normalizeState(JSON.parse(raw));
    }
    catch {
        return initial;
    }
}
function persist() {
    if (typeof window === "undefined")
        return;
    localStorage.setItem(KEY, JSON.stringify(state));
}
function set(updater) {
    state = updater(state);
    persist();
    listeners.forEach((l) => l());
}
export const store = {
    get: () => state,
    subscribe: (l) => {
        listeners.add(l);
        return () => listeners.delete(l);
    },
    // auth
    login(email, password) {
        const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
        if (u)
            set((s) => ({ ...s, currentUserId: u.id, cart: [] }));
        return u ?? null;
    },
    signup(data) {
        if (state.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase()))
            return null;
        const u = { ...data, id: "u" + Date.now(), role: "user" };
        set((s) => ({ ...s, users: [...s.users, u], currentUserId: u.id, cart: [] }));
        return u;
    },
    logout() { set((s) => ({ ...s, currentUserId: null, cart: [] })); },
    syncUser(user) {
        set((s) => {
            const exists = s.users.some((u) => u.id === user.id);
            return {
                ...s,
                users: exists ? s.users.map((u) => u.id === user.id ? { ...u, ...user } : u) : [...s.users, user],
                currentUserId: user.id,
                cart: [],
            };
        });
    },
    currentUser() {
        return state.users.find((u) => u.id === state.currentUserId) ?? null;
    },
    updateProfile(patch) {
        set((s) => ({ ...s, users: s.users.map((u) => u.id === s.currentUserId ? { ...u, ...patch } : u) }));
    },
    changePassword(oldPw, newPw) {
        const u = store.currentUser();
        if (!u || u.password !== oldPw)
            return false;
        store.updateProfile({ password: newPw });
        return true;
    },
    // foods
    addFood(f) {
        set((s) => ({ ...s, foods: [...s.foods, { ...f, id: "f" + Date.now() }] }));
    },
    updateFood(id, patch) {
        set((s) => ({ ...s, foods: s.foods.map((f) => f.id === id ? { ...f, ...patch } : f) }));
    },
    deleteFood(id) {
        set((s) => ({ ...s, foods: s.foods.filter((f) => f.id !== id) }));
    },
    // cart
    addToCart(foodId, qty = 1, soupType) {
        set((s) => {
            const existing = s.cart.find((c) => c.foodId === foodId && c.soupType === soupType);
            const cart = existing
                ? s.cart.map((c) => c === existing ? { ...c, qty: c.qty + qty } : c)
                : [...s.cart, { foodId, qty, soupType }];
            return { ...s, cart };
        });
    },
    updateCartQty(foodId, qty, soupType) {
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
    todayOrderedQty(foodId, userId) {
        const uid = userId ?? state.currentUserId;
        if (!uid)
            return 0;
        const today = new Date().toDateString();
        const orders = Array.isArray(state.orders) ? state.orders : [];
        return orders
            .filter((o) => o.userId === uid && new Date(o.createdAt).toDateString() === today && o.paymentStatus !== "Failed" && o.paymentStatus !== "Rejected")
            .flatMap((o) => Array.isArray(o.items) ? o.items : [])
            .filter((i) => i.foodId === foodId)
            .reduce((sum, i) => sum + (i.qty ?? 0), 0);
    },
    createOrder(data) {
        const u = store.currentUser();
        if (!u)
            return { error: "Not logged in" };
        if (state.cart.length === 0)
            return { error: "Cart is empty" };
        // Validate per-person daily limits
        for (const c of state.cart) {
            const food = state.foods.find((f) => f.id === c.foodId);
            if (!food)
                return { error: "Food not found" };
            if (food.status !== "Available")
                return { error: `${food.name} is ${food.status}` };
            const ordered = store.todayOrderedQty(food.id, u.id);
            if (ordered + c.qty > food.dailyLimit) {
                return { error: `Limit exceeded for ${food.name}. Please come to Dunnkayce physically.` };
            }
        }
        const items = state.cart.map((c) => {
            const f = state.foods.find((x) => x.id === c.foodId);
            return { foodId: f.id, name: f.name + (c.soupType ? ` (${c.soupType})` : ""), qty: c.qty, price: f.price, soupType: c.soupType };
        });
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        const deliveryFee = DELIVERY_FEE;
        const total = subtotal + deliveryFee;
        const order = {
            id: "o" + Date.now(),
            userId: u.id,
            items,
            subtotal,
            deliveryFee,
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
    updateOrderStatus(id, status) {
        set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, status } : o) }));
    },
    updatePaymentStatus(id, paymentStatus) {
        set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, paymentStatus } : o) }));
    },
};
export function useStore(selector) {
    return useSyncExternalStore((cb) => store.subscribe(cb), () => selector(store.get()), () => selector(initial));
}
export function formatNGN(n) {
    return "₦" + n.toLocaleString("en-NG");
}
