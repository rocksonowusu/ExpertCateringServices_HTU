import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { menuItems as staticMenu, type MenuItem } from '@/constants/data';

function rowToItem(r: any): MenuItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: Number(r.price),
    category: r.category,
    image: r.image ?? '',
    rating: Number(r.rating ?? 0),
    reviewCount: r.review_count ?? 0,
    prepTime: r.prep_time ?? '',
    isAvailable: r.is_available ?? true,
    isPopular: r.is_popular ?? false,
    isFeatured: r.is_featured ?? false,
    calories: r.calories ?? undefined,
    tags: r.tags ?? [],
  };
}

function itemToRow(i: MenuItem) {
  return {
    id: i.id,
    name: i.name,
    description: i.description,
    price: i.price,
    category: i.category,
    image: i.image,
    rating: i.rating,
    review_count: i.reviewCount,
    prep_time: i.prepTime,
    is_available: i.isAvailable,
    is_popular: i.isPopular,
    is_featured: i.isFeatured,
    calories: i.calories ?? null,
    tags: i.tags ?? [],
  };
}

interface MenuState {
  items: MenuItem[];
  loaded: boolean;
  loading: boolean;
  loadMenu: () => Promise<void>;
  addItem: (item: MenuItem) => Promise<void>;
  updateItem: (item: MenuItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  /** Upload an image file to Supabase Storage, returns a public URL (or a data URL when unconfigured). */
  uploadImage: (file: File) => Promise<string | null>;
  /** Live menu updates (availability, new items…). Returns an unsubscribe fn. */
  subscribeMenu: () => () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: staticMenu,
  loaded: false,
  loading: false,

  loadMenu: async () => {
    if (!isSupabaseConfigured) {
      set({ items: staticMenu, loaded: true });
      return;
    }
    set({ loading: true });
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: true });
    set({ loading: false, loaded: true });
    if (error || !data || data.length === 0) {
      if (error) console.warn('[menu] loadMenu failed:', error.message);
      set({ items: staticMenu }); // fall back to bundled menu
      return;
    }
    set({ items: data.map(rowToItem) });
  },

  addItem: async (item) => {
    set((s) => ({ items: [item, ...s.items] }));
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('menu_items').insert(itemToRow(item));
    if (error) console.warn('[menu] addItem failed:', error.message);
  },

  updateItem: async (item) => {
    set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) }));
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('menu_items').update(itemToRow(item)).eq('id', item.id);
    if (error) console.warn('[menu] updateItem failed:', error.message);
  },

  removeItem: async (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) console.warn('[menu] removeItem failed:', error.message);
  },

  uploadImage: async (file) => {
    // Unconfigured / non-web: embed as a data URL so the preview still works.
    if (!isSupabaseConfigured) {
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
    if (error) {
      console.warn('[menu] uploadImage failed:', error.message);
      return null;
    }
    const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
    return data.publicUrl;
  },

  subscribeMenu: () => {
    if (!isSupabaseConfigured) return () => {};
    // Unique channel name per subscriber to avoid realtime channel collisions.
    const channel = supabase
      .channel(`menu-feed-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        get().loadMenu();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
