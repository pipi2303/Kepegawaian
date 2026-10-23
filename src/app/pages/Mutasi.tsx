import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowRightLeft, Search, Plus, Eye, Edit2, X,
  FileText, Printer, Building, CheckCircle, Download, Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutasiApi } from '../data/api';
import http from '../lib/http';
import { downloadBlob } from '../lib/downloadBlob';
import { toast } from 'sonner';

const statusConfig: Record<string, { bg: string; color: string }> = {
  Usulan:    { bg: 'bg-gray-100',  color: 'text-gray-600'  },
  Disetujui: { bg: 'bg-blue-50',   color: 'text-blue-700'  },
  Berlaku:   { bg: 'bg-green-50',  color: 'text-green-700' },
  Ditolak:   { bg: 'bg-red-50',    color: 'text-red-700'   },
};

const jenisColor: Record<string, string> = {
  'Mutasi Internal':    'bg-blue-100 text-blue-700',
  'Mutasi Eksternal':   'bg-purple-100 text-purple-700',
  'Rotasi':             'bg-teal-100 text-teal-700',
  'Promosi Jabatan':    'bg-green-100 text-green-700',
  'Promosi Fungsional': 'bg-emerald-100 text-emerald-700',
  'Demosi':             'bg-red-100 text-red-700',
};

const JENIS_LIST = [
  'Mutasi Internal', 'Mutasi Eksternal', 'Rotasi',
  'Promosi Jabatan', 'Promosi Fungsional', 'Demosi',
] as const;

const STATUS_LIST = ['Usulan', 'Disetujui', 'Berlaku', 'Ditolak'] as const;

type JenisMutasi = typeof JENIS_LIST[number];
type StatusMutasi = typeof STATUS_LIST[number];

interface MutasiRecord {
  id: number | string;
  pegawai_id?: number | string;
  pegawaiId?: number | string;
  jenis_mutasi?: JenisMutasi;
  jenisMutasi?: JenisMutasi;
  unit_kerja_asal?: string;
  unitKerjaAsal?: string;
  jabatan_asal?: string;
  jabatanAsal?: string;
  unit_kerja_tujuan?: string;
  unitKerjaTujuan?: string;
  jabatan_tujuan?: string;
  jabatanTujuan?: string;
  golongan_asal?: string;
  golonganAsal?: string;
  golongan_tujuan?: string;
  golonganTujuan?: string;
  tanggal_usulan?: string;
  tanggalUsulan?: string;
  tanggal_berlaku?: string;
  tanggalBerlaku?: string;
  nomor_sk?: string;
  nomorSK?: string;
  status: StatusMutasi;
  alasan?: string;
  catatan_pejabat?: string;
  catatanPejabat?: string;
  pegawai?: { id: number; nama: string; nip?: string; unit_kerja?: string; jabatan?: string; golongan?: string; pangkat?: string; gelar_depan?: string; gelar_belakang?: string };
}

// Normalize snake_case API response to camelCase for UI
const norm = (m: MutasiRecord) => ({
  id:              m.id,
  pegawaiId:       m.pegawai_id   ?? m.pegawaiId,
  jenisMutasi:     (m.jenis_mutasi ?? m.jenisMutasi ?? 'Mutasi Internal') as JenisMutasi,
  unitKerjaAsal:   m.unit_kerja_asal  ?? m.unitKerjaAsal  ?? '',
  jabatanAsal:     m.jabatan_asal     ?? m.jabatanAsal     ?? '',
  unitKerjaTujuan: m.unit_kerja_tujuan ?? m.unitKerjaTujuan ?? '',
  jabatanTujuan:   m.jabatan_tujuan   ?? m.jabatanTujuan   ?? '',
  golonganAsal:    m.golongan_asal    ?? m.golonganAsal    ?? '',
  golonganTujuan:  m.golongan_tujuan  ?? m.golonganTujuan  ?? '',
  tanggalUsulan:   m.tanggal_usulan   ?? m.tanggalUsulan   ?? '',
  tanggalBerlaku:  m.tanggal_berlaku  ?? m.tanggalBerlaku,
  nomorSK:         m.nomor_sk         ?? m.nomorSK,
  status:          m.status,
  alasan:          m.alasan ?? '',
  catatanPejabat:  m.catatan_pejabat  ?? m.catatanPejabat,
  _pegawai:        m.pegawai,
});
type NormMutasi = ReturnType<typeof norm>;

const emptyForm = () => ({
  pegawaiId: '' as number | string,
  jenisMutasi: 'Mutasi Internal' as JenisMutasi,
  unitKerjaAsal: '', jabatanAsal: '', unitKerjaTujuan: '', jabatanTujuan: '',
  golonganAsal: '', golonganTujuan: '', tanggalUsulan: '', tanggalBerlaku: '',
  nomorSK: '', status: 'Usulan' as StatusMutasi, alasan: '', catatanPejabat: '',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDateLong = (d?: string) => {
  if (!d) return '_______________';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],
    [50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I'],
  ];
  let r = '';
  for (const [v, s] of map) { while (n >= v) { r += s; n -= v; } }
  return r;
};

const getMonthYear = (d?: string) => {
  if (!d) return '___';
  const dt = new Date(d);
  return `${toRoman(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

const fullNameOfPegawai = (pg?: { nama: string; gelar_depan?: string; gelar_belakang?: string; gelarDepan?: string; gelarBelakang?: string }) =>
  pg ? `${pg.gelar_depan ?? pg.gelarDepan ?? ''}${pg.gelar_depan ?? pg.gelarDepan ? ' ' : ''}${pg.nama}${pg.gelar_belakang ?? pg.gelarBelakang ? ', ' + (pg.gelar_belakang ?? pg.gelarBelakang) : ''}`.trim() : '_______________';

// ─── Letter Components ────────────────────────────────────────────────────────
const LetterHeader = () => (
  <div className="text-center mb-6 border-b-4 border-double border-gray-800 pb-4">
    <div className="flex items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-gray-800 bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Building className="w-8 h-8 text-gray-700" />
      </div>
      <div className="text-left">
        <p className="text-sm text-gray-700">PEMERINTAH PROVINSI LAMPUNG</p>
        <p className="font-black text-lg text-gray-900 leading-tight">RUMAH SAKIT UMUM DAERAH</p>
        <p className="text-xs text-gray-600 mt-0.5">Jalan Dr. Rivai No. 6, Bandar Lampung 35112</p>
        <p className="text-xs text-gray-600">Telp. (0721) 703312 | Email: info@rs.lampungprov.go.id</p>
      </div>
    </div>
  </div>
);

const LetterFooter = ({ tanggal }: { tanggal?: string }) => (
  <div className="mt-8 flex justify-end">
    <div className="w-72">
      <p className="text-sm">Ditetapkan di Bandar Lampung</p>
      <p className="text-sm">pada tanggal <span className="font-medium">{fmtDateLong(tanggal)}</span></p>
      <p className="text-sm mt-2 font-semibold">DIREKTUR RUMAH SAKIT</p>
      <p className="text-sm">PROVINSI LAMPUNG,</p>
      <div className="h-20" />
      <p className="text-sm font-bold underline">dr. IMAM GHOZALI, Sp.An., M.Kes.</p>
      <p className="text-sm">NIP. 19680415 199703 1 001</p>
    </div>
  </div>
);

// ─── SK Mutasi / Rotasi ───────────────────────────────────────────────────────
const SKMutasi = ({ m, pg }: { m: NormMutasi; pg?: MutasiRecord['pegawai'] }) => {
  const isRotasi = m.jenisMutasi === 'Rotasi';
  const nomorDefault = m.nomorSK || `___/___/SK-${isRotasi ? 'ROT' : 'MUT'}/${getMonthYear(m.tanggalBerlaku || m.tanggalUsulan)}/____`;
  const rows = [
    ['Nama', fullNameOfPegawai(pg)],
    ['NIP', pg?.nip || '_______________'],
    ['Pangkat/Gol. Ruang', `${pg?.pangkat || '___'} / ${m.golonganAsal || pg?.golongan || '___'}`],
    ['Jabatan', m.jabatanAsal || pg?.jabatan || '_______________'],
    ['Unit Kerja Asal', m.unitKerjaAsal || pg?.unit_kerja || '_______________'],
    ['Unit Kerja Tujuan', m.unitKerjaTujuan || '_______________'],
    ...(m.jabatanTujuan ? [['Jabatan Tujuan', m.jabatanTujuan]] : []),
  ];
  return (
    <div className="text-sm space-y-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="text-center space-y-0.5">
        <p className="font-bold">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH</p>
        <p className="font-bold">PROVINSI LAMPUNG</p>
        <p className="font-bold mt-1">NOMOR: {nomorDefault}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">
          {isRotasi ? 'ROTASI PEGAWAI NEGERI SIPIL' : 'PEMINDAHAN/MUTASI PEGAWAI NEGERI SIPIL'}
        </p>
        <p className="font-bold">DI LINGKUNGAN RUMAH SAKIT PROVINSI LAMPUNG</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RUMAH SAKIT,</p>
      </div>
      <div>
        <p className="font-bold">Menimbang:</p>
        <ol className="list-none ml-6 space-y-1 mt-1">
          <li className="flex gap-2"><span>a.</span><span>bahwa dalam rangka pengembangan karir, penyegaran organisasi, dan optimalisasi pelayanan kesehatan di Rumah Sakit Provinsi Lampung;</span></li>
          <li className="flex gap-2"><span>b.</span><span>bahwa {m.alasan || 'dipandang perlu dilakukan pemindahan/mutasi pegawai untuk kepentingan dinas'};</span></li>
          <li className="flex gap-2"><span>c.</span><span>bahwa berdasarkan pertimbangan dimaksud, perlu menetapkan Keputusan tentang {isRotasi ? 'Rotasi' : 'Pemindahan/Mutasi'} Pegawai.</span></li>
        </ol>
      </div>
      <div>
        <p className="font-bold">Mengingat:</p>
        <ol className="list-none ml-6 space-y-1 mt-1">
          {[
            'Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara;',
            'Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil;',
            'Surat Edaran Menteri PANRB Nomor 16 Tahun 2018 tentang Pengembangan Kompetensi PNS.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span>{i + 1}.</span><span>{item}</span></li>
          ))}
        </ol>
      </div>
      <div className="text-center my-4">
        <p className="font-bold border-t border-b border-gray-400 inline-block px-6 py-1">MEMUTUSKAN:</p>
      </div>
      <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RUMAH SAKIT TENTANG {isRotasi ? 'ROTASI' : 'PEMINDAHAN/MUTASI'} PEGAWAI NEGERI SIPIL.</p>
      <div className="space-y-2">
        <p><span className="font-bold">KESATU:</span> Memindahtugaskan pegawai yang namanya tersebut di bawah ini:</p>
        <table className="w-full border border-gray-400 text-sm ml-4">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-gray-300">
                <td className="px-3 py-1.5 w-52 font-medium border-r border-gray-300">{k}</td>
                <td className="px-3 py-1.5">: {v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><span className="font-bold">KEDUA:</span> Pemindahtugasan sebagaimana dimaksud pada diktum KESATU berlaku terhitung mulai tanggal <span className="font-bold">{fmtDateLong(m.tanggalBerlaku || m.tanggalUsulan)}</span>.</p>
        <p><span className="font-bold">KETIGA:</span> Kepada yang bersangkutan diberikan hak-hak kepegawaian sesuai peraturan perundang-undangan yang berlaku.</p>
        <p><span className="font-bold">KEEMPAT:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p>
      </div>
      {m.catatanPejabat && (
        <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 mt-4">
          <p className="text-xs text-gray-500 mb-1">Catatan Pejabat:</p>
          <p>{m.catatanPejabat}</p>
        </div>
      )}
    </div>
  );
};

// ─── SK Promosi ───────────────────────────────────────────────────────────────
const SKPromosi = ({ m, pg }: { m: NormMutasi; pg?: MutasiRecord['pegawai'] }) => {
  const isFungsional = m.jenisMutasi === 'Promosi Fungsional';
  const nomorDefault = m.nomorSK || `___/___/SK-${isFungsional ? 'PF' : 'KJ'}/${getMonthYear(m.tanggalBerlaku || m.tanggalUsulan)}/____`;
  const rows = [
    ['Nama', fullNameOfPegawai(pg)],
    ['NIP', pg?.nip || '_______________'],
    ['Pangkat/Golongan Ruang', `${pg?.pangkat || '___'} / ${m.golonganTujuan || m.golonganAsal || pg?.golongan || '___'}`],
    ['Jabatan Lama', m.jabatanAsal || pg?.jabatan || '_______________'],
    ['Unit Kerja Lama', m.unitKerjaAsal || pg?.unit_kerja || '_______________'],
    ['Jabatan Baru', m.jabatanTujuan || '_______________'],
    ['Unit Kerja Baru', m.unitKerjaTujuan || '_______________'],
  ];
  return (
    <div className="text-sm space-y-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="text-center space-y-0.5">
        <p className="font-bold">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH</p>
        <p className="font-bold">PROVINSI LAMPUNG</p>
        <p className="font-bold mt-1">NOMOR: {nomorDefault}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">{isFungsional ? 'PENGANGKATAN DALAM JABATAN FUNGSIONAL' : 'PENGANGKATAN DALAM JABATAN STRUKTURAL'}</p>
        <p className="font-bold">PADA RUMAH SAKIT PROVINSI LAMPUNG</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RUMAH SAKIT,</p>
      </div>
      <div>
        <p className="font-bold">Menimbang:</p>
        <ol className="list-none ml-6 space-y-1 mt-1">
          <li className="flex gap-2"><span>a.</span><span>bahwa dalam rangka pengembangan karir dan peningkatan kinerja pelayanan kesehatan di Rumah Sakit Provinsi Lampung, dipandang perlu untuk melakukan pengangkatan dalam jabatan;</span></li>
          <li className="flex gap-2"><span>b.</span><span>bahwa pegawai yang namanya tersebut pada diktum keputusan ini telah memenuhi persyaratan dan dianggap cakap untuk menduduki jabatan sebagaimana dimaksud{m.alasan ? `, ${m.alasan.toLowerCase()}` : ''};</span></li>
          <li className="flex gap-2"><span>c.</span><span>bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan huruf b, perlu menetapkan Keputusan Direktur tentang Pengangkatan dalam Jabatan.</span></li>
        </ol>
      </div>
      <div>
        <p className="font-bold">Mengingat:</p>
        <ol className="list-none ml-6 space-y-1 mt-1">
          {[
            'Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara (Lembaran Negara RI Tahun 2014 Nomor 6);',
            'Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil sebagaimana telah diubah dengan PP Nomor 17 Tahun 2020;',
            'Peraturan Menteri PANRB Nomor 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS;',
            'Peraturan Daerah Provinsi Lampung tentang Pembentukan dan Susunan Organisasi Rumah Sakit yang berlaku.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span>{i + 1}.</span><span>{item}</span></li>
          ))}
        </ol>
      </div>
      <div className="text-center my-4">
        <p className="font-bold border-t border-b border-gray-400 inline-block px-6 py-1">MEMUTUSKAN:</p>
      </div>
      <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RUMAH SAKIT TENTANG PENGANGKATAN DALAM JABATAN PADA RUMAH SAKIT PROVINSI LAMPUNG.</p>
      <div className="space-y-2">
        <p><span className="font-bold">KESATU:</span> Mengangkat pegawai berikut dalam jabatan yang tertera:</p>
        <table className="w-full border border-gray-400 text-sm ml-4">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-gray-300">
                <td className="px-3 py-1.5 w-52 font-medium border-r border-gray-300">{k}</td>
                <td className="px-3 py-1.5">: {v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><span className="font-bold">KEDUA:</span> Pegawai yang namanya tersebut pada diktum KESATU mulai menduduki jabatan dan melaksanakan tugas terhitung mulai tanggal <span className="font-bold">{fmtDateLong(m.tanggalBerlaku || m.tanggalUsulan)}</span>.</p>
        <p><span className="font-bold">KETIGA:</span> Kepada yang bersangkutan diberikan penghasilan dan hak-hak lainnya sesuai ketentuan peraturan perundang-undangan yang berlaku.</p>
        <p><span className="font-bold">KEEMPAT:</span> Keputusan ini mulai berlaku pada tanggal ditetapkan.</p>
      </div>
      {m.catatanPejabat && (
        <div className="border-l-4 border-green-400 pl-4 py-2 bg-green-50 mt-4">
          <p className="text-xs text-gray-500 mb-1">Catatan Pejabat:</p>
          <p>{m.catatanPejabat}</p>
        </div>
      )}
    </div>
  );
};

// ─── SK Demosi ────────────────────────────────────────────────────────────────
const SKDemosi = ({ m, pg }: { m: NormMutasi; pg?: MutasiRecord['pegawai'] }) => {
  const nomorDefault = m.nomorSK || `___/___/SK-HK/${getMonthYear(m.tanggalBerlaku || m.tanggalUsulan)}/____`;
  const rows = [
    ['Nama', fullNameOfPegawai(pg)],
    ['NIP', pg?.nip || '_______________'],
    ['Pangkat/Gol. Ruang', `${pg?.pangkat || '___'} / ${m.golonganAsal || pg?.golongan || '___'}`],
    ['Jabatan Sekarang', m.jabatanAsal || pg?.jabatan || '_______________'],
    ['Unit Kerja', m.unitKerjaAsal || pg?.unit_kerja || '_______________'],
    ['Jabatan yang Diduduki Selama Hukuman', m.jabatanTujuan || '_______________'],
    ['Unit Kerja Selama Hukuman', m.unitKerjaTujuan || '_______________'],
  ];
  return (
    <div className="text-sm space-y-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="text-center space-y-0.5">
        <p className="font-bold">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH</p>
        <p className="font-bold">PROVINSI LAMPUNG</p>
        <p className="font-bold mt-1">NOMOR: {nomorDefault}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">PENJATUHAN HUKUMAN DISIPLIN BERUPA PENURUNAN JABATAN</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RUMAH SAKIT,</p>
      </div>
      <div>
        <p className="font-bold">Menimbang:</p>
        <ol className="list-none ml-6 space-y-1 mt-1">
          <li className="flex gap-2"><span>a.</span><span>bahwa telah dilakukan pemeriksaan terhadap {fullNameOfPegawai(pg)} (NIP {pg?.nip || '___'}) terkait dugaan pelanggaran disiplin;</span></li>
          <li className="flex gap-2"><span>b.</span><span>bahwa berdasarkan hasil pemeriksaan, yang bersangkutan terbukti telah melakukan pelanggaran disiplin berupa <span className="font-semibold">{m.alasan || '_______________'}</span>;</span></li>
          <li className="flex gap-2"><span>c.</span><span>bahwa pelanggaran dimaksud termasuk dalam kategori hukuman disiplin tingkat berat sebagaimana diatur dalam Peraturan Pemerintah Nomor 94 Tahun 2021;</span></li>
          <li className="flex gap-2"><span>d.</span><span>bahwa berdasarkan pertimbangan tersebut, perlu menetapkan Keputusan tentang Penjatuhan Hukuman Disiplin.</span></li>
        </ol>
      </div>
      <div>
        <p className="font-bold">Mengingat:</p>
        <ol className="list-none ml-6 space-y-1 mt-1">
          {[
            'Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara;',
            'Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil (Lembaran Negara RI Tahun 2021 Nomor 202);',
            'Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span>{i + 1}.</span><span>{item}</span></li>
          ))}
        </ol>
      </div>
      <div className="text-center my-4">
        <p className="font-bold border-t border-b border-gray-400 inline-block px-6 py-1">MEMUTUSKAN:</p>
      </div>
      <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RUMAH SAKIT TENTANG PENJATUHAN HUKUMAN DISIPLIN BERUPA PENURUNAN JABATAN.</p>
      <div className="space-y-2">
        <p><span className="font-bold">KESATU:</span> Menjatuhkan hukuman disiplin berupa <span className="font-bold">Penurunan Jabatan setingkat lebih rendah selama 12 (dua belas) bulan</span> kepada:</p>
        <table className="w-full border border-gray-400 text-sm ml-4">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-gray-300">
                <td className="px-3 py-1.5 w-64 font-medium border-r border-gray-300">{k}</td>
                <td className="px-3 py-1.5">: {v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><span className="font-bold">KEDUA:</span> Hukuman disiplin sebagaimana dimaksud pada diktum KESATU berlaku terhitung mulai tanggal <span className="font-bold">{fmtDateLong(m.tanggalBerlaku || m.tanggalUsulan)}</span>.</p>
        <p><span className="font-bold">KETIGA:</span> Keputusan ini disampaikan kepada yang bersangkutan untuk diketahui dan dilaksanakan.</p>
        <p><span className="font-bold">KEEMPAT:</span> Pegawai yang bersangkutan dapat mengajukan upaya administratif berupa keberatan dan/atau banding administratif sesuai ketentuan yang berlaku.</p>
        <p><span className="font-bold">KELIMA:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p>
      </div>
      {m.catatanPejabat && (
        <div className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 mt-4">
          <p className="text-xs text-gray-500 mb-1">Catatan Pejabat:</p>
          <p>{m.catatanPejabat}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Mutasi() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [detailData, setDetailData] = useState<NormMutasi | null>(null);
  const [suratData, setSuratData] = useState<NormMutasi | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const suratRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(() => ({
    jenis_mutasi: filterJenis || undefined,
    status: filterStatus || undefined,
    search: search || undefined,
  }), [filterJenis, filterStatus, search]);

  // List mutasi
  const { data: mutasiData, isLoading } = useQuery({
    queryKey: ['mutasi', filters],
    queryFn: () => mutasiApi.getAll(filters),
    staleTime: 60000,
  });

  // Pegawai dropdown
  const { data: pegawaiList } = useQuery({
    queryKey: ['pegawai-dropdown'],
    queryFn: () => http.get('/pegawai', { params: { per_page: 100 } }).then(r => r.data.data?.data ?? r.data.data ?? []),
    staleTime: 300000,
  });

  const rawMutasi: MutasiRecord[] = (mutasiData as any)?.data?.data ?? (mutasiData as any)?.data ?? [];
  const mutasi: NormMutasi[] = rawMutasi.map(norm);

  // Create mutasi
  const createMutation = useMutation({
    mutationFn: mutasiApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mutasi'] });
      toast.success('Mutasi jabatan berhasil dicatat');
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mencatat mutasi'),
  });

  // Surat mutasi PDF from backend
  const suratMutation = useMutation({
    mutationFn: (d: { pegawai_id: number | string; riwayat_id: number | string }) => mutasiApi.suratMutasi({ pegawai_id: Number(d.pegawai_id), riwayat_id: Number(d.riwayat_id) }),
    onSuccess: (res: any) => downloadBlob(res.data, `surat_mutasi_${Date.now()}.pdf`),
    onError: () => toast.error('Gagal mengunduh surat dari server'),
  });

  const pegawaiArr: any[] = pegawaiList ?? [];

  const getPegawaiName = (m: NormMutasi) => {
    if (m._pegawai) return fullNameOfPegawai(m._pegawai);
    const pg = pegawaiArr.find((p: any) => String(p.id) === String(m.pegawaiId));
    if (!pg) return '—';
    return `${pg.gelar_depan ? pg.gelar_depan + ' ' : ''}${pg.nama}${pg.gelar_belakang ? ', ' + pg.gelar_belakang : ''}`.trim();
  };

  const getPegawaiUnitKerja = (m: NormMutasi) => {
    if (m._pegawai) return m._pegawai.unit_kerja;
    return pegawaiArr.find((p: any) => String(p.id) === String(m.pegawaiId))?.unit_kerja;
  };

  const handleOpenEdit = (m: NormMutasi) => {
    setEditId(m.id);
    setForm({
      pegawaiId: m.pegawaiId ?? '',
      jenisMutasi: m.jenisMutasi,
      unitKerjaAsal: m.unitKerjaAsal, jabatanAsal: m.jabatanAsal,
      unitKerjaTujuan: m.unitKerjaTujuan, jabatanTujuan: m.jabatanTujuan,
      golonganAsal: m.golonganAsal, golonganTujuan: m.golonganTujuan,
      tanggalUsulan: m.tanggalUsulan, tanggalBerlaku: m.tanggalBerlaku || '',
      nomorSK: m.nomorSK || '', status: m.status,
      alasan: m.alasan, catatanPejabat: m.catatanPejabat || '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.pegawaiId || !form.tanggalUsulan) { toast.error('Harap isi field wajib'); return; }
    const payload = {
      pegawai_id: form.pegawaiId,
      jenis_mutasi: form.jenisMutasi,
      unit_kerja_asal: form.unitKerjaAsal,
      jabatan_asal: form.jabatanAsal,
      unit_kerja_tujuan: form.unitKerjaTujuan,
      jabatan_tujuan: form.jabatanTujuan,
      golongan_asal: form.golonganAsal,
      golongan_tujuan: form.golonganTujuan,
      tanggal_usulan: form.tanggalUsulan,
      tanggal_berlaku: form.tanggalBerlaku || undefined,
      nomor_sk: form.nomorSK || undefined,
      status: form.status,
      alasan: form.alasan,
      catatan_pejabat: form.catatanPejabat || undefined,
    };
    createMutation.mutate(payload);
  };

  const handlePrintSurat = () => {
    const el = suratRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Surat Keputusan</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; padding: 20mm; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #444; padding: 5px 10px; }
        @media print { @page { size: A4 portrait; margin: 15mm; } }
      </style></head><body>${el.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>`);
    win.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!suratData) return;
    // Try backend PDF first, fall back to jsPDF
    const pgId = suratData.pegawaiId;
    if (pgId) {
      suratMutation.mutate({ pegawai_id: pgId, riwayat_id: suratData.id });
      return;
    }

    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pg = suratData._pegawai ?? pegawaiArr.find((p: any) => String(p.id) === String(suratData.pegawaiId));
      const isPromosi   = suratData.jenisMutasi === 'Promosi Jabatan' || suratData.jenisMutasi === 'Promosi Fungsional';
      const isDemosi    = suratData.jenisMutasi === 'Demosi';
      const isRotasi    = suratData.jenisMutasi === 'Rotasi';
      const isFungsional = suratData.jenisMutasi === 'Promosi Fungsional';

      const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, ML = 25, MR = 25, CW = PW - ML - MR, LH = 5.6;
      let cy = 20;
      const sf = (bold: boolean, size = 12) => { doc.setFont('times', bold ? 'bold' : 'normal'); doc.setFontSize(size); };
      const br = (h = 20) => { if (cy + h > PH - 18) { doc.addPage(); cy = 20; } };

      sf(true, 10); doc.text('PEMERINTAH PROVINSI LAMPUNG', PW / 2, cy, { align: 'center' }); cy += 5;
      sf(true, 14); doc.text('RUMAH SAKIT UMUM DAERAH', PW / 2, cy, { align: 'center' }); cy += 6.5;
      sf(false, 9); doc.text('Jalan Dr. Rivai No. 6, Bandar Lampung 35112', PW / 2, cy, { align: 'center' }); cy += 4.5;
      doc.text('Telp. (0721) 703312 | Email: info@rs.lampungprov.go.id', PW / 2, cy, { align: 'center' }); cy += 5;
      doc.setDrawColor(0); doc.setLineWidth(1); doc.line(ML, cy, PW - MR, cy); cy += 1.5;
      doc.setLineWidth(0.3); doc.line(ML, cy, PW - MR, cy); cy += 8;

      const nomorSK = suratData.nomorSK || `___/___/SK-${isDemosi ? 'HK' : isFungsional ? 'PF' : isPromosi ? 'KJ' : isRotasi ? 'ROT' : 'MUT'}/${getMonthYear(suratData.tanggalBerlaku || suratData.tanggalUsulan)}/____`;
      sf(true, 12); doc.text('KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH', PW / 2, cy, { align: 'center' }); cy += 5.5;
      doc.text('PROVINSI LAMPUNG', PW / 2, cy, { align: 'center' }); cy += 5.5;
      doc.text(`NOMOR: ${nomorSK}`, PW / 2, cy, { align: 'center' }); cy += 9;

      const tgl = fmtDateLong(suratData.tanggalBerlaku || suratData.tanggalUsulan);
      sf(false, 12);
      const sigX = PW - MR - 72;
      br(48); cy += 6;
      doc.text('Ditetapkan di Bandar Lampung', sigX, cy); cy += LH;
      doc.text(`pada tanggal ${tgl}`, sigX, cy); cy += LH + 1;
      sf(true, 12); doc.text('DIREKTUR RUMAH SAKIT', sigX, cy); cy += LH;
      doc.text('PROVINSI LAMPUNG,', sigX, cy); cy += LH * 4.5;
      const namaDr = 'dr. IMAM GHOZALI, Sp.An., M.Kes.';
      doc.text(namaDr, sigX, cy);
      doc.setLineWidth(0.3); doc.line(sigX, cy + 1, sigX + doc.getTextWidth(namaDr), cy + 1); cy += LH;
      sf(false, 12); doc.text('NIP. 19680415 199703 1 001', sigX, cy);

      const namaFile = `SK_${suratData.jenisMutasi.replace(/\s+/g, '_')}_${((pg as any)?.nama || suratData.pegawaiId?.toString() || 'pegawai').replace(/\s+/g, '_')}.pdf`;
      doc.save(namaFile);
      toast.success('PDF berhasil diunduh');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Gagal mengunduh PDF. Gunakan tombol Cetak sebagai alternatif.');
    } finally {
      setPdfLoading(false);
    }
  };

  const getSuratLabel = (jenis: JenisMutasi) => {
    if (jenis === 'Promosi Jabatan' || jenis === 'Promosi Fungsional') return 'SK Promosi';
    if (jenis === 'Demosi') return 'SK Demosi';
    return 'SK Mutasi/Rotasi';
  };

  const getSuratColor = (jenis: JenisMutasi) => {
    if (jenis === 'Promosi Jabatan' || jenis === 'Promosi Fungsional') return 'bg-emerald-600 hover:bg-emerald-700';
    if (jenis === 'Demosi') return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const promosiCount = mutasi.filter(m => m.jenisMutasi.startsWith('Promosi')).length;
  const usulanCount  = mutasi.filter(m => m.status === 'Usulan').length;
  const berlakuCount = mutasi.filter(m => m.status === 'Berlaku').length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mutasi, Rotasi &amp; Promosi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            PP No. 11/2017 Pasal 72–81 · PermenPAN-RB No. 13/2014 · Pola Karir ASN
          </p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm()); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Usulan Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Mutasi/Promosi',       value: mutasi.length,  sub: 'Semua jenis',      color: 'text-blue-600'  },
          { label: 'Promosi Jabatan/Fungsional',  value: promosiCount,   sub: 'Kenaikan jenjang', color: 'text-green-600' },
          { label: 'Menunggu Persetujuan',         value: usulanCount,    sub: 'Perlu tindakan',   color: usulanCount > 0 ? 'text-yellow-600' : 'text-gray-500' },
          { label: 'Telah Berlaku',               value: berlakuCount,   sub: 'SK diterbitkan',   color: 'text-teal-600'  },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama pegawai..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Jenis</option>
            {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
            <option value="">Semua Status</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pegawai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Asal → Tujuan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tgl Usulan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden xl:table-cell">No. SK</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : mutasi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">Tidak ada data mutasi</td>
                </tr>
              ) : mutasi.map(m => {
                const sc = statusConfig[m.status] ?? { bg: 'bg-gray-100', color: 'text-gray-600' };
                return (
                  <tr key={m.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setDetailData(m)}>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm text-gray-800">{getPegawaiName(m)}</p>
                      <p className="text-xs text-gray-400">{getPegawaiUnitKerja(m)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${jenisColor[m.jenisMutasi] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.jenisMutasi}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="max-w-[100px]">
                          <p className="text-gray-600 truncate">{m.jabatanAsal}</p>
                          <p className="text-gray-400 truncate">{m.unitKerjaAsal}</p>
                        </div>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <div className="max-w-[100px]">
                          <p className="text-gray-800 truncate font-medium">{m.jabatanTujuan}</p>
                          <p className="text-gray-400 truncate">{m.unitKerjaTujuan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{fmtDate(m.tanggalUsulan)}</td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-xs font-mono text-gray-500">{m.nomorSK || '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailData(m)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Lihat Detail">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setSuratData(m)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600" title={getSuratLabel(m.jenisMutasi)}>
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleOpenEdit(m)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Surat Modal ─────────────────────────────────────────────────────── */}
      {suratData && (() => {
        const pg = suratData._pegawai ?? pegawaiArr.find((p: any) => String(p.id) === String(suratData.pegawaiId));
        const isPromosi = suratData.jenisMutasi === 'Promosi Jabatan' || suratData.jenisMutasi === 'Promosi Fungsional';
        const isDemosi = suratData.jenisMutasi === 'Demosi';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSuratData(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white ${isPromosi ? 'bg-emerald-600' : isDemosi ? 'bg-red-600' : 'bg-blue-600'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">{getSuratLabel(suratData.jenisMutasi)}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{getPegawaiName(suratData)} · {suratData.jenisMutasi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintSurat} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-gray-700 hover:bg-gray-800 rounded-lg">
                    <Printer className="w-4 h-4" /> Cetak
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading || suratMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg"
                  >
                    {(pdfLoading || suratMutation.isPending)
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses…</>
                      : <><Download className="w-4 h-4" /> Unduh PDF</>
                    }
                  </button>
                  <button onClick={() => setSuratData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
                <div ref={suratRef} className="bg-white shadow-sm mx-auto p-10 max-w-[210mm] min-h-[297mm]" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  <LetterHeader />
                  {isPromosi
                    ? <SKPromosi m={suratData} pg={pg} />
                    : isDemosi
                    ? <SKDemosi m={suratData} pg={pg} />
                    : <SKMutasi m={suratData} pg={pg} />
                  }
                  <LetterFooter tanggal={suratData.tanggalBerlaku || suratData.tanggalUsulan} />
                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">HCMS Application</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[suratData.status]?.bg ?? 'bg-gray-100'} ${statusConfig[suratData.status]?.color ?? 'text-gray-600'}`}>
                      Status: {suratData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {suratData.nomorSK
                    ? <span>No. SK: <span className="font-mono font-medium text-gray-600">{suratData.nomorSK}</span></span>
                    : <span className="italic">Nomor SK belum diisi</span>
                  }
                </p>
                <button onClick={() => setSuratData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailData(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Detail {detailData.jenisMutasi}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSuratData(detailData); setDetailData(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-lg ${getSuratColor(detailData.jenisMutasi)}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {getSuratLabel(detailData.jenisMutasi)}
                </button>
                <button onClick={() => setDetailData(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{getPegawaiName(detailData)}</p>
                  <p className="text-xs text-gray-400">
                    {(detailData._pegawai ?? pegawaiArr.find((p: any) => String(p.id) === String(detailData.pegawaiId)))?.nip}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[detailData.status]?.bg ?? 'bg-gray-100'} ${statusConfig[detailData.status]?.color ?? 'text-gray-600'}`}>
                  {detailData.status}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Jabatan Asal</p>
                    <p className="text-sm font-medium text-gray-700">{detailData.jabatanAsal}</p>
                    <p className="text-xs text-gray-400">{detailData.unitKerjaAsal}</p>
                    {detailData.golonganAsal && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">{detailData.golonganAsal}</span>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Jabatan Tujuan</p>
                    <p className="text-sm font-medium text-gray-800">{detailData.jabatanTujuan}</p>
                    <p className="text-xs text-gray-400">{detailData.unitKerjaTujuan}</p>
                    {detailData.golonganTujuan && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 inline-block">{detailData.golonganTujuan}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Tgl Usulan</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalUsulan)}</p></div>
                {detailData.tanggalBerlaku && <div><p className="text-xs text-gray-400">Tgl Berlaku</p><p className="text-sm text-gray-800">{fmtDate(detailData.tanggalBerlaku)}</p></div>}
                {detailData.nomorSK && <div className="col-span-2"><p className="text-xs text-gray-400">Nomor SK</p><p className="text-sm font-mono text-gray-800">{detailData.nomorSK}</p></div>}
              </div>
              {detailData.alasan && <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-400 mb-1">Alasan/Dasar Mutasi</p><p className="text-sm text-blue-800">{detailData.alasan}</p></div>}
              {detailData.catatanPejabat && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-1">Catatan Pejabat</p><p className="text-sm text-gray-700">{detailData.catatanPejabat}</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setDetailData(null)} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit' : 'Tambah'} Usulan Mutasi/Promosi</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Pegawai *</label>
                <select
                  value={String(form.pegawaiId)}
                  onChange={e => {
                    const pg = pegawaiArr.find((p: any) => String(p.id) === e.target.value);
                    setForm(f => ({
                      ...f, pegawaiId: e.target.value,
                      jabatanAsal: pg?.jabatan || '',
                      unitKerjaAsal: pg?.unit_kerja || pg?.unitKerja || '',
                      golonganAsal: pg?.golongan || '',
                    }));
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawaiArr.map((p: any) => <option key={p.id} value={String(p.id)}>{p.nama}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jenis Mutasi</label>
                  <select value={form.jenisMutasi} onChange={e => setForm(f => ({ ...f, jenisMutasi: e.target.value as JenisMutasi }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusMutasi }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan Asal</label>
                  <input value={form.jabatanAsal} onChange={e => setForm(f => ({ ...f, jabatanAsal: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Jabatan Tujuan</label>
                  <input value={form.jabatanTujuan} onChange={e => setForm(f => ({ ...f, jabatanTujuan: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja Asal</label>
                  <input value={form.unitKerjaAsal} onChange={e => setForm(f => ({ ...f, unitKerjaAsal: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Unit Kerja Tujuan</label>
                  <input value={form.unitKerjaTujuan} onChange={e => setForm(f => ({ ...f, unitKerjaTujuan: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Usulan *</label>
                  <input type="date" value={form.tanggalUsulan} onChange={e => setForm(f => ({ ...f, tanggalUsulan: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Tgl Berlaku</label>
                  <input type="date" value={form.tanggalBerlaku} onChange={e => setForm(f => ({ ...f, tanggalBerlaku: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nomor SK</label>
                <input value={form.nomorSK} onChange={e => setForm(f => ({ ...f, nomorSK: e.target.value }))}
                  placeholder="Contoh: 800/SK-MUT/RSAM/I/2025"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Alasan/Dasar</label>
                <textarea rows={2} value={form.alasan} onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Catatan Pejabat</label>
                <textarea rows={2} value={form.catatanPejabat} onChange={e => setForm(f => ({ ...f, catatanPejabat: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={createMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
