import sorveteCasquinha from "@/assets/sorvete-casquinha.png";
import sundaeChocolate from "@/assets/sundae-chocolate.png";
import milkshakeMorango from "@/assets/milkshake-morango.png";
import acaiBowl from "@/assets/acai-bowl.png";
import xBaconBurger from "@/assets/x-bacon-burger.png";

export const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

export const API = {
  async get(path: string) {
    const token = localStorage.getItem('pointdosabor_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + path, { method: 'GET', headers }); 
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  async post(path: string, data: any) { 
    const token = localStorage.getItem('pointdosabor_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + path, { method: 'POST', headers, body: JSON.stringify(data) }); 
    if (!res.ok) throw new Error('API Error');
    return res;
  },
  async put(path: string, data: any) { 
    const token = localStorage.getItem('pointdosabor_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + path, { method: 'PUT', headers, body: JSON.stringify(data) }); 
    if (!res.ok) throw new Error('API Error');
    return res;
  },
  async del(path: string) { 
    const token = localStorage.getItem('pointdosabor_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + path, { method: 'DELETE', headers }); 
    if (!res.ok) throw new Error('API Error');
    return res;
  }
};

export interface Addon {
  id: string;
  name: string;
  price: number;
  categoryIds: string[];
}

export interface SelectedAddon {
  addon: Addon;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  addons: Addon[];
  isPromo: boolean;
  originalPrice?: number;
  promoExpiry?: string;
  promoStock?: number;
  orderCount: number;
  isMadeToOrder?: boolean;
  subCategory?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: SelectedAddon[];
  notes: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type OrderStatus = "recebido" | "confirmado" | "preparando" | "pronto" | "saiu_entrega" | "entregue" | "cancelado";

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  id: string;
  number: number;
  items: {
    productName: string;
    productPrice: number;
    quantity: number;
    addons: { name: string; price: number; quantity: number }[];
    notes: string;
  }[];
  total: number;
  consumeType: string;
  paymentMethod: string;
  address: string;
  mesa: string;
  customerWhatsApp: string;
  customerCPF: string;
  status: OrderStatus;
  timeline: OrderTimeline[];
  createdAt: string;
  usedPoints?: number;
  discountAmount?: number;
  customerName?: string;
  changeNeededFor?: number;
  deliveryFee?: number;
}

// ── Categories ──
export const defaultCategories: Category[] = [
  { id: "lanches", name: "Lanches & Porções", icon: "sandwich" },
  { id: "doces", name: "Sorvetes & Doces", icon: "ice-cream" },
  { id: "bebidas", name: "Bebidas", icon: "coffee" },
];

const CATEGORIES_KEY = "pointdosabor_categories_v1";

export function getCategories(): Category[] {
  const data = localStorage.getItem(CATEGORIES_KEY);
  const categories = data ? JSON.parse(data) : defaultCategories;
  const orderMap: Record<string, number> = { lanche: 1, burger: 1, hamb: 1, sobremesa: 2, doce: 2, bebida: 3 };
  const getOrder = (cat: Category) => {
    const n = cat.name.toLowerCase();
    for (const [key, val] of Object.entries(orderMap)) {
      if (n.includes(key)) return val;
    }
    return 99;
  };
  return categories.sort((a: Category, b: Category) => getOrder(a) - getOrder(b));
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Falha ao buscar categorias');
    const data = await res.json();
    const orderMap: Record<string, number> = { lanche: 1, burger: 1, hamb: 1, sobremesa: 2, doce: 2, bebida: 3 };
    const getOrder = (cat: Category) => {
      const n = cat.name.toLowerCase();
      for (const [key, val] of Object.entries(orderMap)) {
        if (n.includes(key)) return val;
      }
      return 99;
    };
    return data.sort((a: Category, b: Category) => getOrder(a) - getOrder(b));
  } catch (error) {
    console.error(error);
    return getCategories();
  }
}

// ── Addons ──
export const defaultAddons: Addon[] = [
  { id: "cobertura-choc", name: "Cobertura de Chocolate", price: 2.0, categoryIds: ["sorvetes", "sobremesas"] },
  { id: "cobertura-morango", name: "Cobertura de Morango", price: 2.0, categoryIds: ["sorvetes", "sobremesas"] },
  { id: "cobertura-caramelo", name: "Cobertura de Caramelo", price: 2.0, categoryIds: ["sorvetes", "sobremesas"] },
  { id: "granulado", name: "Granulado", price: 1.5, categoryIds: ["sorvetes", "sobremesas"] },
  { id: "chantilly", name: "Chantilly", price: 2.5, categoryIds: ["sorvetes", "sobremesas", "bebidas"] },
  { id: "leite-condensado", name: "Leite Condensado", price: 2.0, categoryIds: ["sorvetes", "acai", "sobremesas"] },
  { id: "leite-ninho", name: "Leite Ninho", price: 3.0, categoryIds: ["sorvetes", "acai", "sobremesas"] },
  { id: "granola", name: "Granola", price: 2.5, categoryIds: ["acai", "sorvetes"] },
  { id: "banana", name: "Banana", price: 2.0, categoryIds: ["acai", "sorvetes"] },
  { id: "morango", name: "Morango Extra", price: 3.5, categoryIds: ["acai", "sorvetes", "sobremesas"] },
  { id: "pacoca", name: "Paçoca", price: 2.0, categoryIds: ["acai", "sorvetes"] },
  { id: "confete", name: "Confete", price: 2.5, categoryIds: ["sorvetes", "sobremesas"] },
  { id: "bacon", name: "Bacon", price: 5.0, categoryIds: ["lanches", "porcoes"] },
  { id: "queijo-extra", name: "Queijo Extra", price: 4.0, categoryIds: ["lanches", "porcoes"] },
  { id: "ovo", name: "Ovo", price: 3.0, categoryIds: ["lanches"] },
  { id: "cheddar", name: "Cheddar", price: 4.5, categoryIds: ["lanches", "porcoes"] },
  { id: "salada", name: "Salada Extra", price: 2.0, categoryIds: ["lanches"] },
  { id: "catupiry", name: "Catupiry", price: 4.0, categoryIds: ["lanches", "porcoes"] },
];

const ADDONS_KEY = "digitalmenu_addons_v1";

export function getAddons(): Addon[] {
  const stored = localStorage.getItem(ADDONS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fallback */ }
  }
  localStorage.setItem(ADDONS_KEY, JSON.stringify(defaultAddons));
  return defaultAddons;
}

export function saveAddons(addons: Addon[]) {
  localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
}

export async function fetchAddons(): Promise<Addon[]> {
  try {
    const res = await fetch(`${API_URL}/addons`);
    if (!res.ok) throw new Error('Falha ao buscar adicionais');
    return await res.json();
  } catch (error) {
    console.error(error);
    return getAddons();
  }
}

export function getAddonsForCategory(categoryId: string): Addon[] {
  return getAddons().filter((a) => a.categoryIds.includes(categoryId));
}

// ── Products ──
const imageMap: Record<string, string> = {
  "1": sorveteCasquinha, "2": sorveteCasquinha, "3": sorveteCasquinha,
  "4": sundaeChocolate, "5": sundaeChocolate,
  "6": milkshakeMorango, "7": milkshakeMorango,
  "8": acaiBowl, "9": acaiBowl, "10": acaiBowl, "11": acaiBowl,
  "12": xBaconBurger, "13": xBaconBurger, "14": xBaconBurger, "15": xBaconBurger,
  "16": xBaconBurger, "17": xBaconBurger,
};

const sorveteAddons = defaultAddons.filter(a => a.categoryIds.includes("sorvetes"));
const acaiAddons = defaultAddons.filter(a => a.categoryIds.includes("acai"));
const lancheAddons = defaultAddons.filter(a => a.categoryIds.includes("lanches"));
const sobremesaAddons = defaultAddons.filter(a => a.categoryIds.includes("sobremesas"));

export const defaultProducts: Product[] = [
  // Lanches & Porções - Hambúrgueres
  { id: "12", name: "X-Burguer", description: "Pão artesanal, hambúrguer bovino 150g, queijo, alface e tomate", price: 22.0, image: xBaconBurger, category: "lanches", subCategory: "Hambúrgueres", addons: lancheAddons, isPromo: false, orderCount: 410 },
  { id: "13", name: "X-Bacon", description: "Pão artesanal, hambúrguer bovino 150g, bacon crocante, queijo e molho especial", price: 28.0, image: xBaconBurger, category: "lanches", subCategory: "Hambúrgueres", addons: lancheAddons, isPromo: true, orderCount: 380 },
  { id: "14", name: "X-Tudo", description: "Pão artesanal, hambúrguer duplo, bacon, ovo, cheddar, alface, tomate e milho", price: 35.0, image: xBaconBurger, category: "lanches", subCategory: "Hambúrgueres", addons: lancheAddons, isPromo: false, orderCount: 290 },
  
  // Lanches & Porções - Frango
  { id: "15", name: "X-Frango", description: "Pão artesanal, filé de frango grelhado, queijo, alface e maionese da casa", price: 25.0, image: xBaconBurger, category: "lanches", subCategory: "Frango", addons: lancheAddons, isPromo: false, orderCount: 220 },
  
  // Lanches & Porções - Hot Dogs
  { id: "16", name: "Hot Dog Tradicional", description: "Pão de hot dog, duas salsichas, vinagrete, batata palha e molhos", price: 15.0, image: xBaconBurger, category: "lanches", subCategory: "Hot Dogs", addons: lancheAddons.slice(0, 4), isPromo: false, orderCount: 350 },
  { id: "17", name: "Hot Dog Especial", description: "Pão de hot dog, duas salsichas, cheddar, bacon, milho, ervilha e batata palha", price: 22.0, image: xBaconBurger, category: "lanches", subCategory: "Hot Dogs", addons: lancheAddons, isPromo: true, orderCount: 280 },

  // Lanches & Porções - Porções
  { id: "18", name: "Batata Frita", description: "Porção generosa de batata frita crocante com sal e temperos", price: 18.0, image: xBaconBurger, category: "lanches", subCategory: "Porções", addons: defaultAddons.filter(a => a.categoryIds.includes("porcoes")), isPromo: false, orderCount: 390 },
  { id: "19", name: "Batata com Cheddar e Bacon", description: "Batata frita coberta com cheddar cremoso e bacon crocante", price: 28.0, image: xBaconBurger, category: "lanches", subCategory: "Porções", addons: defaultAddons.filter(a => a.categoryIds.includes("porcoes")), isPromo: true, orderCount: 310 },

  // Sorvetes & Doces - Sorvetes
  { id: "1", name: "Sorvete 1 Bola", description: "Uma bola de sorvete artesanal no sabor à sua escolha servida na casquinha ou copinho", price: 8.0, image: sorveteCasquinha, category: "doces", subCategory: "Sorvetes", addons: sorveteAddons, isPromo: false, orderCount: 520, isMadeToOrder: true },
  { id: "2", name: "Sorvete 2 Bolas", description: "Duas bolas de sorvete artesanal nos sabores à sua escolha", price: 14.0, image: sorveteCasquinha, category: "doces", subCategory: "Sorvetes", addons: sorveteAddons, isPromo: false, orderCount: 430, isMadeToOrder: true },
  { id: "3", name: "Sorvete 3 Bolas", description: "Três bolas de sorvete artesanal nos sabores à sua escolha com cobertura grátis", price: 18.0, image: sorveteCasquinha, category: "doces", subCategory: "Sorvetes", addons: sorveteAddons, isPromo: true, orderCount: 380, isMadeToOrder: true },
  { id: "4", name: "Sundae de Chocolate", description: "Sorvete de creme com calda quente de chocolate belga, chantilly e granulado", price: 22.0, image: sundaeChocolate, category: "doces", subCategory: "Sorvetes", addons: sorveteAddons, isPromo: true, orderCount: 290, isMadeToOrder: true },
  { id: "5", name: "Sundae de Morango", description: "Sorvete de morango com calda de frutas vermelhas, chantilly e morango fresco", price: 22.0, image: sundaeChocolate, category: "doces", subCategory: "Sorvetes", addons: sorveteAddons, isPromo: false, orderCount: 245, isMadeToOrder: true },
  
  // Sorvetes & Doces - Milk-Shakes
  { id: "6", name: "Milk-Shake Chocolate", description: "Cremoso milk-shake de chocolate com sorvete artesanal e chantilly", price: 18.0, image: milkshakeMorango, category: "doces", subCategory: "Milk-Shakes", addons: sorveteAddons.slice(0, 5), isPromo: false, orderCount: 310, isMadeToOrder: true },
  { id: "7", name: "Milk-Shake Morango", description: "Milk-shake de morango natural com sorvete e chantilly", price: 18.0, image: milkshakeMorango, category: "doces", subCategory: "Milk-Shakes", addons: sorveteAddons.slice(0, 5), isPromo: false, orderCount: 280, isMadeToOrder: true },

  // Sorvetes & Doces - Açaí & Bowls
  { id: "8", name: "Açaí 300ml", description: "Açaí puro batido na hora, escolha seus acompanhamentos favoritos", price: 15.0, image: acaiBowl, category: "doces", subCategory: "Açaí & Bowls", addons: acaiAddons, isPromo: false, orderCount: 620, isMadeToOrder: true },
  { id: "9", name: "Açaí 500ml", description: "Açaí puro batido na hora com acompanhamentos à sua escolha", price: 22.0, image: acaiBowl, category: "doces", subCategory: "Açaí & Bowls", addons: acaiAddons, isPromo: true, orderCount: 510, isMadeToOrder: true },
  { id: "10", name: "Açaí 700ml", description: "Porção generosa de açaí puro com acompanhamentos inclusos", price: 28.0, image: acaiBowl, category: "doces", subCategory: "Açaí & Bowls", addons: acaiAddons, isPromo: false, orderCount: 340, isMadeToOrder: true },
  { id: "11", name: "Bowl de Açaí Premium", description: "Açaí na tigela com granola, banana, morango, leite ninho e mel", price: 32.0, image: acaiBowl, category: "doces", subCategory: "Açaí & Bowls", addons: acaiAddons, isPromo: true, orderCount: 195, isMadeToOrder: true },

  // Sorvetes & Doces - Sobremesas
  { id: "27", name: "Banana Split", description: "Banana com 3 bolas de sorvete, caldas de chocolate e morango, chantilly e cereja", price: 28.0, image: sundaeChocolate, category: "doces", subCategory: "Sobremesas", addons: sobremesaAddons, isPromo: true, orderCount: 175, isMadeToOrder: true },
  { id: "28", name: "Brownie com Sorvete", description: "Brownie quentinho de chocolate com bola de sorvete de creme e calda", price: 24.0, image: sundaeChocolate, category: "doces", subCategory: "Sobremesas", addons: sobremesaAddons, isPromo: false, orderCount: 210 },

  // Bebidas
  { id: "22", name: "Coca-Cola 350ml", description: "Refrigerante gelado", price: 7.0, image: "", category: "bebidas", subCategory: "Refrigerantes", addons: [], isPromo: false, orderCount: 680 },
  { id: "23", name: "Guaraná Antarctica 350ml", description: "Refrigerante gelado", price: 6.5, image: "", category: "bebidas", subCategory: "Refrigerantes", addons: [], isPromo: false, orderCount: 420 },
  { id: "24", name: "Suco Natural 500ml", description: "Suco natural da fruta, escolha: laranja, maracujá ou limão", price: 12.0, image: "", category: "bebidas", subCategory: "Sucos", addons: [], isPromo: false, orderCount: 260, isMadeToOrder: true },
  { id: "25", name: "Água Mineral 500ml", description: "Água mineral gelada", price: 4.0, image: "", category: "bebidas", subCategory: "Sucos", addons: [], isPromo: false, orderCount: 530 },
];

const STORAGE_KEY = "pointdosabor_products_v1";

if (typeof window !== "undefined") {
  localStorage.removeItem("digitalmenu_products");
  localStorage.removeItem("digitalmenu_products_v2");
}

const BASE_URL = API_URL.replace(/\/api$/, '');
const fixUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE_URL}${url}` : url;
};

export function getProducts(): Product[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const products: Product[] = JSON.parse(stored);
      return products.map((p) => ({ 
        ...p, 
        image: imageMap[p.id] || fixUrl(p.image),
        images: p.images?.map(fixUrl)
      }));
    } catch { /* fallback */ }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
  return defaultProducts;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Falha ao buscar produtos');
    const data = await res.json();
    return data.map((p: Product) => ({ 
      ...p, 
      image: imageMap[p.id] || fixUrl(p.image) || p.id,
      images: p.images?.map(fixUrl)
    })); // mapping images for mock data compatibility
  } catch (error) {
    console.error(error);
    return getProducts(); // fallback pro localStorage
  }
}


export function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// ── Orders ──
const ORDERS_KEY = "digitalmenu_orders_v1";
const ORDER_COUNTER_KEY = "digitalmenu_order_counter";

export function getOrders(): Order[] {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fallback */ }
  }
  return [];
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_URL}/orders`);
    if (!res.ok) throw new Error('Falha ao buscar pedidos');
    return await res.json();
  } catch (error) {
    console.error(error);
    return getOrders();
  }
}

export function getNextOrderNumber(): number {
  const current = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) || "0", 10);
  const next = current + 1;
  localStorage.setItem(ORDER_COUNTER_KEY, next.toString());
  return next;
}

export function addOrder(order: Order) {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}

export async function addOrderAsync(order: Order) {
  return API.post('/orders', order);
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    order.timeline.push({ status, timestamp: new Date().toISOString() });
    saveOrders(orders);
  }
  return orders;
}

// Get orders by CPF or WhatsApp/phone number lookup for customer view
export function getOrdersByLookup(term: string): Order[] {
  const cleanTerm = term.replace(/\D/g, "");
  if (!cleanTerm) return [];
  return getOrders().filter((o) => {
    const cleanCPF = o.customerCPF ? o.customerCPF.replace(/\D/g, "") : "";
    const cleanWA = o.customerWhatsApp ? o.customerWhatsApp.replace(/\D/g, "") : "";
    return (cleanCPF && cleanCPF === cleanTerm) || (cleanWA && (cleanWA.endsWith(cleanTerm) || cleanTerm.endsWith(cleanWA)));
  });
}

export async function fetchOrdersByLookup(term: string): Promise<Order[]> {
  try {
    const res = await fetch(`${API_URL}/orders`);
    if (!res.ok) throw new Error('Falha ao buscar pedidos');
    const data = await res.json();
    const cleanTerm = term.replace(/\D/g, "");
    if (!cleanTerm) return [];
    return data.filter((o: Order) => {
      const cleanCPF = o.customerCPF ? o.customerCPF.replace(/\D/g, "") : "";
      const cleanWA = o.customerWhatsApp ? o.customerWhatsApp.replace(/\D/g, "") : "";
      return (cleanCPF && cleanCPF === cleanTerm) || (cleanWA && (cleanWA.endsWith(cleanTerm) || cleanTerm.endsWith(cleanWA)));
    });
  } catch (error) {
    console.error(error);
    return getOrdersByLookup(term);
  }
}

// Keep these for backward compatibility
export function getOrdersByCPF(cpf: string): Order[] {
  return getOrdersByLookup(cpf);
}

export async function fetchOrdersByCPF(cpf: string): Promise<Order[]> {
  return fetchOrdersByLookup(cpf);
}

// ── Loyalty ──
export interface LoyaltySettings {
  active: boolean | number;
  spent_amount: number;
  points_earned: number;
  points_for_discount: number;
  discount_amount: number;
}

export async function fetchLoyaltySettings(): Promise<LoyaltySettings> {
  try {
    const res = await fetch(`${API_URL}/loyalty/settings`);
    if (!res.ok) throw new Error('Falha ao buscar config fidelidade');
    return await res.json();
  } catch (e) {
    console.error(e);
    return { active: 0, spent_amount: 1, points_earned: 1, points_for_discount: 10, discount_amount: 1 };
  }
}

export async function saveLoyaltySettings(settings: LoyaltySettings) {
  return API.put('/loyalty/settings', settings);
}

export async function fetchCustomerPoints(cpf: string): Promise<number> {
  if (!cpf || cpf.replace(/\D/g, '').length !== 11) return 0;
  try {
    const res = await fetch(`${API_URL}/loyalty/customer/${cpf.replace(/\D/g, '')}`);
    if (!res.ok) throw new Error('Falha ao buscar pontos');
    const data = await res.json();
    return data.points || 0;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

// ── Store Settings ──
export interface StoreSettings {
  has_delivery: boolean | number;
  has_table: boolean | number;
  has_pickup: boolean | number;
  accepts_pix: boolean | number;
  accepts_cash: boolean | number;
  accepts_card: boolean | number;
  opening_time: string;
  closing_time: string;
  delivery_fee: number;
  delivery_info_text?: string;
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const res = await fetch(`${API_URL}/store/settings`);
    if (!res.ok) throw new Error('Falha ao buscar configurações da loja');
    return await res.json();
  } catch (e) {
    console.error(e);
    return {
      has_delivery: 1,
      has_table: 1,
      has_pickup: 1,
      accepts_pix: 1,
      accepts_cash: 1,
      accepts_card: 1,
      opening_time: "13:00",
      closing_time: "22:00",
      delivery_fee: 0.00,
      delivery_info_text: ""
    };
  }
}

export async function saveStoreSettings(settings: StoreSettings) {
  return API.put('/store/settings', settings);
}
export const fetchDashboardStats = async () => {
  try {
    const data = await API.get('/dashboard/stats');
    return data;
  } catch (error) {
    console.error("Error fetching dashboard stats", error);
    return { revenue: 0, topProducts: [], peakHours: [] };
  }
};
