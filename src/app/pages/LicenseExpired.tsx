import { Lock, AlertTriangle } from 'lucide-react';

interface Props {
  valid: boolean;
  expire: string;
  rs: string;
  days_left: number;
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LicenseExpired({ valid, expire, rs, days_left }: Props) {
  const expired = days_left === 0 && !valid;
  const subtitle = expired
    ? 'Lisensi aplikasi HCMS telah kadaluarsa.'
    : 'Lisensi tidak ditemukan atau tidak valid.';

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-blue-100 rounded-full p-4">
            {expired ? (
              <AlertTriangle className="w-10 h-10 text-blue-700" />
            ) : (
              <Lock className="w-10 h-10 text-blue-700" />
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lisensi Tidak Valid</h1>
          <p className="mt-2 text-gray-500 text-sm">{subtitle}</p>
        </div>

        {/* RS Info */}
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Rumah Sakit</span>
            <span className="font-medium text-gray-800">{rs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Berlaku hingga</span>
            <span className="font-medium text-gray-800">{formatTanggal(expire)}</span>
          </div>
        </div>

        {/* Contact box */}
        <div className="bg-blue-700 text-white rounded-xl p-5 space-y-3">
          <p className="font-semibold text-sm">Hubungi tim Intramedika untuk perpanjangan lisensi</p>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-700 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            WhatsApp Intramedika
          </a>
        </div>

        <p className="text-xs text-gray-400">
          Untuk bantuan teknis:{' '}
          <a href="mailto:support@intramedika.id" className="underline hover:text-gray-600">
            support@intramedika.id
          </a>
        </p>
      </div>
    </div>
  );
}
