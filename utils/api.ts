import { ENDPOINTS } from "./config";

// client/src/utils/api.ts
const BASE = ENDPOINTS.GLOBAL;

export interface GlobalCard {
  _id: string;
  title: string;
  title_ru?: string;
  title_en?: string;
  title_kk?: string;
  imageUri: string;
  audio_kk?: string;
  section: string;
  line: number;
  page: number;
  version: number;
  updatedAt: string;
}

// 1) manifest
export async function fetchManifest() {
  const res = await fetch(`${BASE}/manifest`);
  if (!res.ok) throw new Error('Failed to load manifest');
  return res.json() as Promise<{ version: number; updatedAt: string }>;
}

// 2) changes since a timestamp
export async function fetchChanges(since: string) {
  const url = since
    ? `${BASE}/changes?since=${encodeURIComponent(since)}`
    : `${BASE}/changes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load changes');
  return res.json() as Promise<
    { id: string; action: 'add' | 'update' | 'delete'; updatedAt: string }[]
  >;
}

// 3) full card by id
export async function fetchCardById(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(`Failed to load card ${id}`);
  return res.json() as Promise<GlobalCard>;
}
