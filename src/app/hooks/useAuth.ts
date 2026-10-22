import { createContext, useContext } from 'react';

export interface AuthUser {
  id: number;
  nip: string;
  nama: string;
  email: string;
  jabatan: string;
  unit_kerja: string;
  golongan: string;
  foto?: string;
  sisa_cuti_tahunan: number;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  can: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
