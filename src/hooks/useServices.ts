import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/types';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        setLoading(false);
        return;
      }
      setServices((data as Service[]) ?? []);
      setLoading(false);
    }
    fetchServices();
  }, []);

  return { services, loading, setServices };
}
