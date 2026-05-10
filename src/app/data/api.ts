import type { Pegawai, CutiRecord, AbsensiRecord } from '../types';
import { 
  dataPegawai as initialPegawai, 
  dataCuti as initialCuti 
} from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API for Pegawai
export const pegawaiApi = {
  getAll: async (): Promise<Pegawai[]> => {
    await delay(500);
    // In real app, this would be a fetch call to Supabase/Backend
    const saved = localStorage.getItem('hcms_pegawai');
    return saved ? JSON.parse(saved) : initialPegawai;
  },
  saveAll: (data: Pegawai[]) => {
    localStorage.setItem('hcms_pegawai', JSON.stringify(data));
  }
};

// Mock API for Cuti
export const cutiApi = {
  getAll: async (): Promise<CutiRecord[]> => {
    await delay(600);
    const saved = localStorage.getItem('hcms_cuti');
    return saved ? JSON.parse(saved) : initialCuti;
  },
  saveAll: (data: CutiRecord[]) => {
    localStorage.setItem('hcms_cuti', JSON.stringify(data));
  }
};

// Mock API for Absensi
export const absensiApi = {
  getAll: async (): Promise<AbsensiRecord[]> => {
    await delay(700);
    const saved = localStorage.getItem('hcms_absensi');
    // Using global constant if available or returning empty for now
    // In AppContext.tsx it's generated, we should persist that generation
    return saved ? JSON.parse(saved) : [];
  },
  saveAll: (data: AbsensiRecord[]) => {
    localStorage.setItem('hcms_absensi', JSON.stringify(data));
  }
};
