import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockOrders, type Order } from '@/constants/data';

type Status = Order['status'];

export interface NewOrderInput {
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: Order['paymentMethod'];
  paymentStatus?: Order['paymentStatus'];
  status?: Status;
  channel?: Order['channel'];
  pickupTime: string;
  notes?: string;
  userId?: string;
  customerName?: string;
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  loadAll: () => Promise<void>;
  loadMine: (userId?: string) => Promise<void>;
  placeOrder: (input: NewOrderInput) => Promise<Order>;
  updateStatus: (code: string, status: Status) => Promise<void>;
  setPaymentStatus: (code: string, status: Order['paymentStatus']) => Promise<void>;
  /** Live admin feed. Returns an unsubscribe fn. */
  subscribe: () => () => void;
}

// Friendly, human-readable order code shown throughout the UI.
function genCode() {
  return 'HTU' + Date.now().toString().slice(-6);
}

// Map a Supabase row into the Order shape the screens already expect.
function rowToOrder(r: any): Order {
  return {
    id: r.code,
    items: r.items ?? [],
    total: Number(r.total),
    status: r.status,
    createdAt: r.created_at,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status ?? 'unpaid',
    paidAt: r.paid_at ?? undefined,
    channel: r.channel ?? 'app',
    pickupTime: r.pickup_time ?? '',
    customerName: r.customer_name ?? undefined,
  };
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: false,

  loadAll: async () => {
    if (!isSupabaseConfigured) {
      set({ orders: mockOrders });
      return;
    }
    set({ loading: true });
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    set({ loading: false });
    if (error) {
      console.warn('[orders] loadAll failed:', error.message);
      return;
    }
    set({ orders: (data ?? []).map(rowToOrder) });
  },

  loadMine: async (userId) => {
    if (!isSupabaseConfigured) {
      set({ orders: mockOrders });
      return;
    }
    set({ loading: true });
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    set({ loading: false });
    if (error) {
      console.warn('[orders] loadMine failed:', error.message);
      return;
    }
    set({ orders: (data ?? []).map(rowToOrder) });
  },

  placeOrder: async (input) => {
    const code = genCode();
    const paymentStatus = input.paymentStatus ?? 'unpaid';
    const status = input.status ?? 'pending';
    const paidAt = paymentStatus === 'paid' ? new Date().toISOString() : undefined;
    const optimistic: Order = {
      id: code,
      items: input.items,
      total: input.total,
      status,
      createdAt: new Date().toISOString(),
      paymentMethod: input.paymentMethod,
      paymentStatus,
      paidAt,
      channel: input.channel ?? 'app',
      pickupTime: input.pickupTime,
      customerName: input.customerName,
    };

    if (!isSupabaseConfigured) {
      set((s) => ({ orders: [optimistic, ...s.orders] }));
      return optimistic;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        code,
        user_id: input.userId ?? null,
        customer_name: input.customerName ?? null,
        items: input.items,
        total: input.total,
        status,
        payment_method: input.paymentMethod,
        payment_status: paymentStatus,
        paid_at: paidAt ?? null,
        channel: input.channel ?? 'app',
        pickup_time: input.pickupTime,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    const saved = rowToOrder(data);
    set((s) => ({ orders: [saved, ...s.orders.filter((o) => o.id !== saved.id)] }));
    return saved;
  },

  updateStatus: async (code, status) => {
    // Optimistic update so the admin UI feels instant.
    set((s) => ({ orders: s.orders.map((o) => (o.id === code ? { ...o, status } : o)) }));
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('orders').update({ status }).eq('code', code);
    if (error) console.warn('[orders] updateStatus failed:', error.message);
  },

  setPaymentStatus: async (code, status) => {
    const paidAt = status === 'paid' ? new Date().toISOString() : undefined;
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === code ? { ...o, paymentStatus: status, paidAt: paidAt ?? o.paidAt } : o
      ),
    }));
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: status, paid_at: paidAt ?? null })
      .eq('code', code);
    if (error) console.warn('[orders] setPaymentStatus failed:', error.message);
  },

  subscribe: () => {
    if (!isSupabaseConfigured) return () => {};
    // Unique channel name per subscriber — multiple screens can subscribe at once
    // without colliding ("cannot add postgres_changes callbacks after subscribe()").
    const channel = supabase
      .channel(`orders-feed-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Re-pull the list on any insert/update — simple and correct for low volume.
          get().loadAll();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
