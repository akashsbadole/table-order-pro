import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  gst_rate: number;
  is_veg: boolean;
  is_available: boolean;
  category_id: string | null;
  category_name?: string;
  description: string | null;
  image_url: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

export function useMenuCategories() {
  return useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as MenuCategory[];
    },
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, gst_rate, is_veg, is_available, category_id, description, image_url')
        .eq('is_available', true)
        .order('sort_order');
      if (error) throw error;
      return data as MenuItem[];
    },
  });
}
