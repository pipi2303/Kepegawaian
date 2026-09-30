/**
 * DashboardWidgets.tsx
 * Shared micro-components untuk Dashboard — dipisah agar Dashboard.tsx
 * tidak melebihi batas transform (~130KB) pada Figma Make dev server.
 */
import React from 'react';
import {
  ArrowUpRight, TrendingDown,
  XCircle, AlertTriangle, Info, CheckCircle2,
} from 'lucide-react';
import { C } from './colors';

// ─── StatCard ──────────────────────────────────────────────────────────────────
export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; up: boolean };
  onClick?: () => void;
  badge?: { text: string; color: string };
}

export function StatCard({
  label, value, sub, subColor = 'text-gray-500',
  icon: Icon, iconBg, iconColor, trend, onClick, badge,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#038E7D]/30' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.text}</span>
        )}
        {!badge && trend && (
          <span className={`text-[11px] font-medium flex items-center gap-0.5 ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

// ─── AlertItem ─────────────────────────────────────────────────────────────────
export interface AlertItemProps {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  desc: string;
  count?: number;
  onClick?: () => void;
}

export function AlertItem({ type, title, desc, count, onClick }: AlertItemProps) {
  const styles = {
    danger:  { bg: 'bg-red-50',   border: 'border-red-200',   icon: XCircle,      iconColor: 'text-red-500',   textColor: 'text-red-800',   descColor: 'text-red-600',   badgeBg: 'bg-red-100 text-red-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', textColor: 'text-amber-800', descColor: 'text-amber-600', badgeBg: 'bg-amber-100 text-amber-700' },
    info:    { bg: 'bg-[#013E37]/5',  border: 'border-[#013E37]/20',  icon: Info,         iconColor: 'text-[#048A75]',  textColor: 'text-[#012B26]',  descColor: 'text-[#013E37]',  badgeBg: 'bg-[#013E37]/10 text-[#013E37]' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, iconColor: 'text-green-500', textColor: 'text-green-800', descColor: 'text-green-600', badgeBg: 'bg-green-100 text-green-700' },
  };
  const s = styles[type];
  const TypeIcon = s.icon;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${s.bg} ${s.border} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <TypeIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${s.textColor}`}>{title}</p>
        <p className={`text-[11px] ${s.descColor} mt-0.5`}>{desc}</p>
      </div>
      {count !== undefined && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${s.badgeBg}`}>{count}</span>
      )}
    </div>
  );
}

// ─── TabButton ─────────────────────────────────────────────────────────────────
export interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export function TabButton({ active, onClick, icon: Icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${active ? 'bg-[#013E37] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 ${active ? 'bg-white text-[#013E37]' : 'bg-red-500 text-white'}`}>{badge}</span>
      )}
    </button>
  );
}

// ─── MiniBar ───────────────────────────────────────────────────────────────────
export interface MiniBarProps { value: number; total: number; color: string; }

export function MiniBar({ value, total, color }: MiniBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── HealthGauge ───────────────────────────────────────────────────────────────
export interface HealthGaugeProps { score: number; }

export function HealthGauge({ score }: HealthGaugeProps) {
  const color = score >= 85 ? C.success : score >= 70 ? C.accent : score >= 55 ? C.warning : C.danger;
  const label = score >= 85 ? 'Sangat Baik' : score >= 70 ? 'Baik' : score >= 55 ? 'Cukup' : 'Perlu Perhatian';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference * 0.75;
  const gap = circumference * 0.75 - dash;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-[135deg]">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${gap + circumference * 0.25}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{score}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}