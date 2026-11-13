import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SiteContent, SiteContentMap } from '@/types';

export function useSiteContent() {
  const [content, setContent] = useState<SiteContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      const { data, error } = await supabase.from('site_content').select('*');
      if (error) {
        console.error('Error fetching site content:', error);
        setLoading(false);
        return;
      }
      const map: SiteContentMap = {};
      (data as SiteContent[]).forEach((item) => {
        map[item.key] = item;
      });
      setContent(map);
      setLoading(false);
    }
    fetchContent();
  }, []);

  function getContent(key: string): string {
    return content[key]?.value ?? '';
  }

  return { content, getContent, loading, setContent };
}
