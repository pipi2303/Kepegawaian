import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, SlidersHorizontal, Loader2, ArrowRight } from 'lucide-react';

export interface SearchCategory {
  label: string;
  value: string;
}

export interface SearchBarProps {
  /** The current search query string (controlled) */
  value?: string;
  /** Callback fired whenever the query changes */
  onChange?: (query: string) => void;
  /** Callback fired when user submits the search (Enter) */
  onSearch?: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds before calling onChange (default 0 for instant real-time) */
  debounceMs?: number;
  /** Optional categories/filters dropdown options */
  categories?: SearchCategory[];
  /** Currently selected category value */
  selectedCategory?: string;
  /** Callback when category changes */
  onCategoryChange?: (category: string) => void;
  /** Optional count of filtered results */
  resultsCount?: number;
  /** Optional total count before filter */
  totalCount?: number;
  /** Whether search operation is in loading state */
  loading?: boolean;
  /** Custom CSS classes for the outer wrapper */
  className?: string;
  /** Show shortcut hint (Ctrl+K or /) */
  showShortcut?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
}

/**
 * Reusable SearchBar component with instant real-time filtering,
 * debounce support, keyboard shortcuts (Ctrl+K / /), category selector, and clear button.
 */
export default function SearchBar({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Cari pegawai (nama, NIP), jabatan, atau unit kerja...',
  debounceMs = 0,
  categories,
  selectedCategory,
  onCategoryChange,
  resultsCount,
  totalCount,
  loading = false,
  className = '',
  showShortcut = true,
  autoFocus = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when controlled value changes externally
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K or '/') to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced notification to parent
  useEffect(() => {
    if (debounceMs <= 0) return;

    const timer = setTimeout(() => {
      if (onChange && internalValue !== controlledValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (debounceMs <= 0 && onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    if (onChange) onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault();
      onSearch(internalValue);
    }
  };

  const hasFilterFeedback = resultsCount !== undefined && totalCount !== undefined;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      <div
        className={`relative flex items-center bg-white border rounded-2xl transition-all duration-200 shadow-xs ${
          isFocused
            ? 'border-[#013E37] ring-3 ring-[#013E37]/10 shadow-sm'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* Category Filter Dropdown (Optional) */}
        {categories && categories.length > 0 && (
          <div className="relative border-r border-gray-200 shrink-0">
            <select
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
              className="appearance-none bg-transparent pl-3.5 pr-8 py-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Search Icon */}
        <div className="pl-3.5 pr-1 flex items-center pointer-events-none text-gray-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#013E37]" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Main Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent py-2.5 px-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
        />

        {/* Right Actions: Clear Button & Shortcut Badge */}
        <div className="flex items-center gap-1.5 pr-3 shrink-0">
          {internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Hapus pencarian"
              aria-label="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {showShortcut && !internalValue && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Results Count Feedback (e.g., "Menampilkan 12 dari 1.603 pegawai") */}
      {hasFilterFeedback && (
        <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
          <span>
            Menampilkan <strong className="text-[#013E37] font-bold">{resultsCount}</strong> dari{' '}
            {totalCount?.toLocaleString('id-ID')} data
          </span>
          {internalValue && (
            <button
              onClick={handleClear}
              className="text-[#013E37] font-semibold hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to perform client-side multi-field filtering on any dataset.
 *
 * @param items Array of records to filter
 * @param query Search string
 * @param fields Array of object keys to match against (e.g. ['nama', 'nip', 'jabatan', 'unit_kerja'])
 */
export function filterRecords<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T | string)[]
): T[] {
  if (!query || !query.trim()) return items;

  const normalized = query.toLowerCase().trim();

  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field as keyof T];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(normalized);
    })
  );
}
