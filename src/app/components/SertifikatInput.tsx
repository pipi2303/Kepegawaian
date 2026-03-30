/**
 * SertifikatInput — Tag-style input untuk mengelola daftar sertifikat keahlian
 */
import React, { useState, useRef } from 'react';
import { X, Plus, BadgeCheck } from 'lucide-react';

// Warna chip berdasarkan index agar variatif
const CHIP_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

interface SertifikatInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  changed?: boolean;
}

export function SertifikatInput({ value, onChange, changed }: SertifikatInputProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function add() {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput('');
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      remove(value.length - 1);
    }
  }

  return (
    <div className="space-y-3">
      {/* Area chip + input */}
      <div
        className={`min-h-[44px] w-full border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text transition-colors ${
          focused
            ? changed
              ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/40'
              : 'border-blue-400 ring-2 ring-blue-200'
            : changed
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((s, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${
              CHIP_COLORS[i % CHIP_COLORS.length]
            }`}
          >
            <BadgeCheck className="w-3 h-3 flex-shrink-0" />
            {s}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(i); }}
              className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={value.length === 0 ? 'Ketik nama sertifikat, lalu Enter…' : ''}
          className="flex-1 min-w-[160px] outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Tombol Tambah + hint */}
      <div className="flex items-center gap-2">
        {input.trim() && (
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#013E37] text-white rounded-lg hover:bg-[#025046] transition-colors"
          >
            <Plus className="w-3 h-3" /> Tambah "{input.trim()}"
          </button>
        )}
        <p className="text-[11px] text-gray-400">
          {value.length} sertifikat · Tekan <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">Enter</kbd> atau klik tombol untuk menambah
        </p>
      </div>

      {/* Saran cepat */}
      {value.length === 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-gray-400 font-medium">Saran umum:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'STR Dokter', 'SIP Dokter', 'STR Perawat', 'SIP Perawat',
              'ACLS', 'BTCLS', 'BLS Provider', 'ATLS',
              'Patient Safety Officer', 'Pengadaan Barang/Jasa',
            ].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { if (!value.includes(s)) onChange([...value, s]); }}
                className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-[#048A75] hover:text-[#013E37] hover:bg-[#013E37]/5 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}