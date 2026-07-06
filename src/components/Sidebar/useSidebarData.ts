import { useState, useEffect, useCallback } from 'react';
import type { Collection, SavedRequest, HistoryItem, ArchivedRequest } from '../../types';
import * as db from '../../services/database';
import { message } from '../ui';

interface SidebarData {
  collections: Collection[];
  savedRequests: SavedRequest[];
  history: HistoryItem[];
  archives: ArchivedRequest[];
  loading: boolean;
  reload: () => void;
}

export const useSidebarData = (refreshTrigger: number): SidebarData => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [archives, setArchives] = useState<ArchivedRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r, h, a] = await Promise.all([
        db.getCollections(),
        db.getSavedRequests(),
        db.getHistory(),
        db.getArchivedRequests(),
      ]);
      setCollections(c);
      setSavedRequests(r);
      setHistory(h);
      setArchives(a);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);

  return { collections, savedRequests, history, archives, loading, reload: loadData };
};
