import { create } from 'zustand';

import type { AppError } from '@/core/errors/AppError';
import type { SyncReport } from '../domain/SyncService';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastReport: SyncReport | null;
  errorMessage: string | null;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (value: string | null) => void;
  syncStarted: () => void;
  syncSucceeded: (report: SyncReport) => void;
  syncFailed: (error: AppError) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as SyncStatus,
  isOnline: true,
  pendingCount: 0,
  lastSyncedAt: null,
  lastReport: null,
  errorMessage: null,
};

export const useSyncStore = create<SyncState>((set) => ({
  ...initialState,
  setOnline: (isOnline) =>
    set((state) => ({
      isOnline,
      status: !isOnline ? 'offline' : state.status === 'offline' ? 'idle' : state.status,
    })),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  syncStarted: () => set({ status: 'syncing', errorMessage: null }),
  syncSucceeded: (report) =>
    set({ status: 'idle', lastReport: report, lastSyncedAt: report.finishedAt, errorMessage: null }),
  syncFailed: (error) =>
    set({ status: error.code === 'NETWORK' ? 'offline' : 'error', errorMessage: error.message }),
  reset: () => set(initialState),
}));
