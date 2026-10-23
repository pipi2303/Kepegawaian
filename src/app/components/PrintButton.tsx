import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Cetak' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 print:hidden"
    >
      <Printer className="w-4 h-4" /> {label}
    </button>
  );
}

export default PrintButton;
