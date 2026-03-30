/**
 * EmployeeAvatar.tsx
 * Avatar pegawai: tampilkan foto jika tersedia, fallback ke inisial berwarna.
 * Warna avatar bersifat deterministik berdasarkan ID pegawai.
 */
import React, { useState } from 'react';
import { UserCircle2 } from 'lucide-react';

// 12 warna deterministik — konsisten per ID pegawai
const PALETTE = [
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-purple-500 to-purple-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-teal-500 to-teal-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-pink-500 to-pink-600',
  'from-orange-500 to-orange-600',
  'from-lime-600 to-lime-700',
  'from-sky-500 to-sky-600',
];

function getGradient(id: string): string {
  const num = parseInt(id.replace(/\D/g, '') || '0', 10);
  return PALETTE[num % PALETTE.length];
}

function getInitials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  id: string;
  nama: string;
  foto?: string;
  /** Tailwind size: 'sm' (w-8/h-8), 'md' (w-10/h-10), 'lg' (w-14/h-14), 'xl' (w-20/h-20) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Extra tailwind classes for the wrapper */
  className?: string;
  /** Shape override: 'circle' (default) | 'rounded' */
  shape?: 'circle' | 'rounded';
}

const sizeMap = {
  sm:  { box: 'w-8 h-8',   text: 'text-xs',    icon: 'w-4 h-4' },
  md:  { box: 'w-10 h-10', text: 'text-sm',     icon: 'w-5 h-5' },
  lg:  { box: 'w-14 h-14', text: 'text-base',   icon: 'w-7 h-7' },
  xl:  { box: 'w-20 h-20', text: 'text-2xl',    icon: 'w-10 h-10' },
};

export function EmployeeAvatar({ id, nama, foto, size = 'md', className = '', shape = 'circle' }: Props) {
  const [imgErr, setImgErr] = useState(false);
  const { box, text, icon } = sizeMap[size];
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const gradient = getGradient(id);

  if (foto && !imgErr) {
    return (
      <div className={`${box} ${radius} overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={foto}
          alt={nama}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const initials = getInitials(nama);
  return (
    <div
      className={`${box} ${radius} bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 font-semibold text-white select-none ${text} ${className}`}
      title={nama}
    >
      {initials}
    </div>
  );
}

// ─── Upload helper ─────────────────────────────────────────────────────────────
interface UploadProps {
  foto?: string;
  nama: string;
  id: string;
  onChange: (base64: string) => void;
  onRemove: () => void;
}

export function AvatarUpload({ foto, nama, id, onChange, onRemove }: UploadProps) {
  const [imgErr, setImgErr] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      onChange(result);
      setImgErr(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="relative group">
        {foto && !imgErr ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm">
            <img src={foto} alt={nama} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${(() => {
            const num = parseInt(id.replace(/\D/g, '') || '0', 10);
            return PALETTE[num % PALETTE.length];
          })()} flex items-center justify-center border-2 border-gray-200 shadow-sm`}>
            <span className="text-white text-2xl font-bold">{getInitials(nama || '?')}</span>
          </div>
        )}
        {/* Hover overlay */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <span className="text-white text-[10px] font-semibold text-center leading-tight px-1">Ubah<br/>Foto</span>
        </button>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#048A75]/50 text-[#013E37] rounded-lg hover:bg-[#013E37]/5 transition-colors"
        >
          <UserCircle2 className="w-3.5 h-3.5" />
          {foto && !imgErr ? 'Ganti Foto' : 'Upload Foto'}
        </button>
        {foto && !imgErr && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            Hapus Foto
          </button>
        )}
        <p className="text-[10px] text-gray-400">JPG, PNG, maks. 2MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}