import React, { useState, useRef, useMemo } from 'react';
import {
  FileText, TrendingUp, TrendingDown, RefreshCw, AlertTriangle,
  UserMinus, ShieldOff, Printer, Eye, X, ChevronRight,
  Download, Info, CheckCircle, Building, Calendar, Hash,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Pegawai } from '../types';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────
type TemplateSurat =
  | 'promosi' | 'demosi' | 'rotasi'
  | 'teguran_lisan' | 'teguran_tertulis'
  | 'pemberhentian_hormat' | 'pemberhentian_tidak_hormat';

interface SuratForm {
  // common
  nomorSurat: string;
  tanggalSurat: string;
  pegawaiId: string;
  // promosi
  jabatanBaru?: string;
  unitKerjaBaru?: string;
  tmtJabatanBaru?: string;
  golonganBaru?: string;
  alasanPromosi?: string;
  // demosi
  jabatanDemosi?: string;
  unitKerjaDemosi?: string;
  tmtDemosi?: string;
  alasanDemosi?: string;
  // rotasi
  unitKerjaAsal?: string;
  unitKerjaTujuan?: string;
  jabatanRotasi?: string;
  tmtRotasi?: string;
  alasanRotasi?: string;
  // teguran
  pelanggaran?: string;
  tanggalPelanggaran?: string;
  kronologiPelanggaran?: string;
  dasarPasal?: string;
  // pemberhentian
  tanggalBerlakuPemberhentian?: string;
  alasanPemberhentian?: string;
  hukumanPidana?: string;
}

// ─── Template Configurations ─────────────────────────────────────────────────
const templateConfig = {
  promosi: {
    label: 'SK Kenaikan Jabatan / Promosi',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    desc: 'Surat Keputusan pengangkatan/kenaikan jabatan struktural atau fungsional',
    dasar: ['UU No. 5 Tahun 2014 tentang ASN', 'PP No. 11 Tahun 2017 tentang Manajemen PNS', 'PermenPAN-RB No. 13 Tahun 2019 tentang Jabatan Fungsional'],
    perihal: 'Kenaikan Jabatan',
  },
  demosi: {
    label: 'SK Penurunan Jabatan / Demosi',
    icon: TrendingDown,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    activeBg: 'bg-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
    desc: 'Surat Keputusan penurunan jabatan sebagai hukuman disiplin tingkat berat',
    dasar: ['UU No. 5 Tahun 2014 tentang ASN', 'PP No. 94 Tahun 2021 tentang Disiplin PNS', 'PP No. 11 Tahun 2017 tentang Manajemen PNS'],
    perihal: 'Penurunan Jabatan',
  },
  rotasi: {
    label: 'SK Mutasi / Rotasi',
    icon: RefreshCw,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Surat Keputusan pemindahan/mutasi pegawai antar unit kerja atau jabatan',
    dasar: ['UU No. 5 Tahun 2014 tentang ASN', 'PP No. 11 Tahun 2017 tentang Manajemen PNS', 'SE Menteri PANRB No. 16 Tahun 2018'],
    perihal: 'Pemindahan/Mutasi Pegawai',
  },
  teguran_lisan: {
    label: 'Surat Teguran Lisan',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    activeBg: 'bg-yellow-500',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    desc: 'Surat teguran lisan sebagai hukuman disiplin tingkat ringan PNS',
    dasar: ['PP No. 94 Tahun 2021 Pasal 7 ayat (2) huruf a tentang Disiplin PNS', 'UU No. 5 Tahun 2014 tentang ASN'],
    perihal: 'Penjatuhan Hukuman Disiplin Tingkat Ringan (Teguran Lisan)',
  },
  teguran_tertulis: {
    label: 'Surat Teguran Tertulis',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
    desc: 'Surat teguran tertulis sebagai hukuman disiplin tingkat ringan PNS',
    dasar: ['PP No. 94 Tahun 2021 Pasal 7 ayat (2) huruf b tentang Disiplin PNS', 'UU No. 5 Tahun 2014 tentang ASN'],
    perihal: 'Penjatuhan Hukuman Disiplin Tingkat Ringan (Teguran Tertulis)',
  },
  pemberhentian_hormat: {
    label: 'SK Pemberhentian dengan Hormat',
    icon: UserMinus,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    activeBg: 'bg-gray-600',
    badgeColor: 'bg-gray-100 text-gray-700',
    desc: 'Surat Keputusan pemberhentian dengan hormat (pensiun, meninggal, atas permintaan sendiri)',
    dasar: ['UU No. 5 Tahun 2014 Pasal 87 tentang ASN', 'PP No. 11 Tahun 2017 tentang Manajemen PNS', 'PP No. 17 Tahun 2020 tentang Perubahan PP No. 11 Tahun 2017'],
    perihal: 'Pemberhentian dengan Hormat sebagai Pegawai Negeri Sipil',
  },
  pemberhentian_tidak_hormat: {
    label: 'SK Pemberhentian Tidak dengan Hormat',
    icon: ShieldOff,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    activeBg: 'bg-red-600',
    badgeColor: 'bg-red-100 text-red-700',
    desc: 'Surat Keputusan pemberhentian tidak dengan hormat (PTDH) akibat pelanggaran berat',
    dasar: ['UU No. 5 Tahun 2014 Pasal 87 ayat (4) tentang ASN', 'PP No. 94 Tahun 2021 Pasal 8 tentang Disiplin PNS', 'Putusan Mahkamah Agung (jika ada)'],
    perihal: 'Pemberhentian Tidak dengan Hormat sebagai Pegawai Negeri Sipil',
  },
};

const UNIT_LIST = [
  'Instalasi Rawat Inap', 'Instalasi Rawat Jalan', 'Instalasi Gawat Darurat',
  'Instalasi Bedah Sentral', 'Instalasi Farmasi', 'Instalasi Laboratorium',
  'Instalasi Radiologi', 'Instalasi Gizi', 'Instalasi Rekam Medis',
  'Bidang Pelayanan Medis', 'Bidang Keperawatan', 'Bidang Penunjang Medis',
  'Bagian Umum dan Kepegawaian', 'Bagian Keuangan', 'Bagian Perencanaan',
];

const ALASAN_PEMBERHENTIAN_HORMAT = [
  'Atas permintaan sendiri',
  'Mencapai batas usia pensiun',
  'Meninggal dunia',
  'Cacat jasmani dan/atau rohani sehingga tidak dapat menjalankan tugas',
  'Tidak cakap jasmani dan/atau rohani sehingga tidak dapat menjalankan tugas',
];

const ALASAN_PTH = [
  'Melakukan penyelewengan terhadap Pancasila dan Undang-Undang Dasar 1945',
  'Dihukum penjara atau kurungan berdasarkan putusan pengadilan yang telah memiliki kekuatan hukum tetap',
  'Menjadi anggota dan/atau pengurus partai politik',
  'Melakukan tindak pidana kejahatan jabatan atau yang ada hubungannya dengan jabatan',
  'Tidak masuk kerja tanpa keterangan selama 46 hari kerja atau lebih secara kumulatif dalam 1 tahun',
  'Menyalahgunakan wewenang yang berdampak sistemik pada institusi',
];

const EMPTY_FORM: SuratForm = {
  nomorSurat: '', tanggalSurat: new Date().toISOString().split('T')[0], pegawaiId: '',
  jabatanBaru: '', unitKerjaBaru: '', tmtJabatanBaru: '', golonganBaru: '', alasanPromosi: '',
  jabatanDemosi: '', unitKerjaDemosi: '', tmtDemosi: '', alasanDemosi: '',
  unitKerjaAsal: '', unitKerjaTujuan: '', jabatanRotasi: '', tmtRotasi: '', alasanRotasi: '',
  pelanggaran: '', tanggalPelanggaran: '', kronologiPelanggaran: '', dasarPasal: '',
  tanggalBerlakuPemberhentian: '', alasanPemberhentian: '', hukumanPidana: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDateLong = (d: string) => {
  if (!d) return '_______________';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const toRoman = (n: number): string => {
  const map: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let result = '';
  for (const [v, s] of map) { while (n >= v) { result += s; n -= v; } }
  return result;
};

const getMonthYear = (d: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${toRoman(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

// ─── Letter Preview Components ────────────────────────────────────────────────
const LetterHeader = () => (
  <div className="text-center mb-6 border-b-4 border-double border-gray-800 pb-4">
    <div className="flex items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-gray-800 bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Building className="w-8 h-8 text-gray-700" />
      </div>
      <div className="text-left">
        <p className="text-sm text-gray-700">PEMERINTAH PROVINSI LAMPUNG</p>
        <p className="font-black text-lg text-gray-900 leading-tight">RUMAH SAKIT UMUM DAERAH ABDUL MOELOEK</p>
        <p className="text-xs text-gray-600 mt-0.5">Jalan Dr. Rivai No. 6, Bandar Lampung 35112</p>
        <p className="text-xs text-gray-600">Telp. (0721) 703312 | Email: rsam@lampungprov.go.id</p>
      </div>
    </div>
  </div>
);

// ─── SK Promosi ────────────────────────────────────────────────────────────
const PreviewPromosi = ({ form, pegawai }: { form: SuratForm; pegawai: Pegawai | undefined }) => {
  const fullName = pegawai ? `${pegawai.gelarDepan || ''} ${pegawai.nama}${pegawai.gelarBelakang ? ', ' + pegawai.gelarBelakang : ''}`.trim() : '_______________';
  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-bold text-sm">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH ABDUL MOELOEK</p>
        <p className="font-bold text-sm">PROVINSI LAMPUNG</p>
        <p className="font-bold text-sm mt-1">NOMOR: {form.nomorSurat || '___/___/SK-KJ/___/____'}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">PENGANGKATAN DALAM JABATAN</p>
        <p className="font-bold">PADA RSUD ABDUL MOELOEK PROVINSI LAMPUNG</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RSUD ABDUL MOELOEK,</p>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-bold">Menimbang:</p>
          <ol type="a" className="list-none ml-6 space-y-1 mt-1">
            <li className="flex gap-2"><span className="flex-shrink-0">a.</span><span>bahwa dalam rangka pengembangan karir dan peningkatan kinerja pelayanan kesehatan di RSUD Abdul Moeloek Provinsi Lampung, dipandang perlu untuk melakukan pengangkatan dalam jabatan;</span></li>
            <li className="flex gap-2"><span className="flex-shrink-0">b.</span><span>bahwa pegawai yang namanya tersebut pada diktum keputusan ini telah memenuhi persyaratan dan dianggap cakap untuk menduduki jabatan sebagaimana dimaksud{form.alasanPromosi ? `, ${form.alasanPromosi.toLowerCase()}` : ''};</span></li>
            <li className="flex gap-2"><span className="flex-shrink-0">c.</span><span>bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan huruf b, perlu menetapkan Keputusan Direktur tentang Pengangkatan dalam Jabatan.</span></li>
          </ol>
        </div>

        <div>
          <p className="font-bold">Mengingat:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            {['Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara (Lembaran Negara Republik Indonesia Tahun 2014 Nomor 6, Tambahan Lembaran Negara Nomor 5494);',
              'Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 17 Tahun 2020;',
              'Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS;',
              'Peraturan Daerah Provinsi Lampung tentang Pembentukan dan Susunan Organisasi Rumah Sakit Umum Daerah Abdul Moeloek Provinsi Lampung yang berlaku.'
            ].map((item, i) => (
              <li key={i} className="flex gap-2"><span className="flex-shrink-0">{i + 1}.</span><span>{item}</span></li>
            ))}
          </ol>
        </div>

        <div className="text-center my-4">
          <p className="font-bold border-t border-b border-gray-400 inline-block px-6 py-1">MEMUTUSKAN:</p>
        </div>
        <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RSUD ABDUL MOELOEK TENTANG PENGANGKATAN DALAM JABATAN PADA RSUD ABDUL MOELOEK PROVINSI LAMPUNG.</p>

        <div className="space-y-2">
          <p><span className="font-bold">KESATU:</span> Mengangkat pegawai berikut dalam jabatan yang tertera:</p>
          <table className="w-full border border-gray-400 text-sm ml-6">
            <tbody>
              {[
                ['Nama', fullName],
                ['NIP', pegawai?.nip || '_______________'],
                ['Pangkat/Golongan Ruang', `${pegawai?.pangkat || '___'} / ${form.golonganBaru || pegawai?.golongan || '___'}`],
                ['Jabatan Lama', pegawai?.jabatan || '_______________'],
                ['Unit Kerja Lama', pegawai?.unitKerja || '_______________'],
                ['Jabatan Baru', form.jabatanBaru || '_______________'],
                ['Unit Kerja Baru', form.unitKerjaBaru || '_______________'],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-300">
                  <td className="px-3 py-1.5 w-48 font-medium border-r border-gray-300">{k}</td>
                  <td className="px-3 py-1.5">: {v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><span className="font-bold">KEDUA:</span> Pegawai yang namanya tersebut pada diktum KESATU mulai menduduki jabatan dan melaksanakan tugas terhitung mulai tanggal <span className="font-bold">{fmtDateLong(form.tmtJabatanBaru || '')}</span>.</p>
          <p><span className="font-bold">KETIGA:</span> Kepada yang bersangkutan diberikan penghasilan dan hak-hak lainnya sesuai ketentuan peraturan perundang-undangan yang berlaku.</p>
          <p><span className="font-bold">KEEMPAT:</span> Keputusan ini mulai berlaku pada tanggal ditetapkan, dengan ketentuan apabila dikemudian hari terdapat kekeliruan akan diadakan perbaikan sebagaimana mestinya.</p>
        </div>
      </div>
    </div>
  );
};

// ─── SK Demosi ─────────────────────────────────────────────────────────────
const PreviewDemosi = ({ form, pegawai }: { form: SuratForm; pegawai: Pegawai | undefined }) => {
  const fullName = pegawai ? `${pegawai.gelarDepan || ''} ${pegawai.nama}${pegawai.gelarBelakang ? ', ' + pegawai.gelarBelakang : ''}`.trim() : '_______________';
  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-bold text-sm">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH ABDUL MOELOEK</p>
        <p className="font-bold text-sm">PROVINSI LAMPUNG</p>
        <p className="font-bold text-sm mt-1">NOMOR: {form.nomorSurat || '___/___/SK-HK/___/____'}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">PENJATUHAN HUKUMAN DISIPLIN BERUPA PENURUNAN JABATAN</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RSUD ABDUL MOELOEK,</p>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-bold">Menimbang:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            <li className="flex gap-2"><span>a.</span><span>bahwa telah dilakukan pemeriksaan terhadap {fullName} (NIP {pegawai?.nip || '___'}) terkait dugaan pelanggaran disiplin;</span></li>
            <li className="flex gap-2"><span>b.</span><span>bahwa berdasarkan hasil pemeriksaan, yang bersangkutan terbukti telah melakukan pelanggaran disiplin berupa <span className="font-semibold">{form.alasanDemosi || '_______________'}</span>;</span></li>
            <li className="flex gap-2"><span>c.</span><span>bahwa pelanggaran dimaksud termasuk dalam kategori hukuman disiplin tingkat berat sebagaimana diatur dalam Peraturan Pemerintah Nomor 94 Tahun 2021;</span></li>
            <li className="flex gap-2"><span>d.</span><span>bahwa berdasarkan pertimbangan tersebut, perlu menetapkan Keputusan tentang Penjatuhan Hukuman Disiplin.</span></li>
          </ol>
        </div>
        <div>
          <p className="font-bold">Mengingat:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            {['Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara;',
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
        <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RSUD ABDUL MOELOEK TENTANG PENJATUHAN HUKUMAN DISIPLIN BERUPA PENURUNAN JABATAN.</p>
        <div className="space-y-2">
          <p><span className="font-bold">KESATU:</span> Menjatuhkan hukuman disiplin berupa <span className="font-bold">Penurunan Jabatan setingkat lebih rendah selama 12 (dua belas) bulan</span> kepada:</p>
          <table className="w-full border border-gray-400 text-sm ml-6">
            <tbody>
              {[['Nama', fullName], ['NIP', pegawai?.nip || '___'], ['Jabatan Sekarang', pegawai?.jabatan || '___'], ['Unit Kerja', pegawai?.unitKerja || '___'], ['Jabatan yang Diduduki Selama Hukuman', form.jabatanDemosi || '___'], ['Unit Kerja Selama Hukuman', form.unitKerjaDemosi || '___']].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-300"><td className="px-3 py-1.5 w-56 font-medium border-r border-gray-300">{k}</td><td className="px-3 py-1.5">: {v}</td></tr>
              ))}
            </tbody>
          </table>
          <p><span className="font-bold">KEDUA:</span> Hukuman disiplin sebagaimana dimaksud pada diktum KESATU berlaku terhitung mulai tanggal <span className="font-bold">{fmtDateLong(form.tmtDemosi || '')}</span>.</p>
          <p><span className="font-bold">KETIGA:</span> Keputusan ini disampaikan kepada yang bersangkutan untuk diketahui dan dilaksanakan.</p>
          <p><span className="font-bold">KEEMPAT:</span> Pegawai yang bersangkutan dapat mengajukan upaya administratif berupa keberatan dan/atau banding administratif sesuai ketentuan yang berlaku.</p>
          <p><span className="font-bold">KELIMA:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p>
        </div>
      </div>
    </div>
  );
};

// ─── SK Rotasi ─────────────────────────────────────────────────────────────
const PreviewRotasi = ({ form, pegawai }: { form: SuratForm; pegawai: Pegawai | undefined }) => {
  const fullName = pegawai ? `${pegawai.gelarDepan || ''} ${pegawai.nama}${pegawai.gelarBelakang ? ', ' + pegawai.gelarBelakang : ''}`.trim() : '_______________';
  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-bold text-sm">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH ABDUL MOELOEK</p>
        <p className="font-bold text-sm">PROVINSI LAMPUNG</p>
        <p className="font-bold text-sm mt-1">NOMOR: {form.nomorSurat || '___/___/SK-MUT/___/____'}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">PEMINDAHAN/MUTASI PEGAWAI NEGERI SIPIL</p>
        <p className="font-bold">DI LINGKUNGAN RSUD ABDUL MOELOEK PROVINSI LAMPUNG</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RSUD ABDUL MOELOEK,</p>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-bold">Menimbang:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            <li className="flex gap-2"><span>a.</span><span>bahwa dalam rangka pengembangan karir, penyegaran organisasi, dan optimalisasi pelayanan kesehatan di RSUD Abdul Moeloek Provinsi Lampung;</span></li>
            <li className="flex gap-2"><span>b.</span><span>bahwa {form.alasanRotasi || 'dipandang perlu dilakukan pemindahan/mutasi pegawai untuk kepentingan dinas'};</span></li>
            <li className="flex gap-2"><span>c.</span><span>bahwa berdasarkan pertimbangan dimaksud, perlu menetapkan Keputusan tentang Pemindahan/Mutasi Pegawai.</span></li>
          </ol>
        </div>
        <div>
          <p className="font-bold">Mengingat:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            {['Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara;', 'Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil;', 'Surat Edaran Menteri PANRB Nomor 16 Tahun 2018 tentang Pengembangan Kompetensi PNS.'].map((item, i) => (
              <li key={i} className="flex gap-2"><span>{i + 1}.</span><span>{item}</span></li>
            ))}
          </ol>
        </div>
        <div className="text-center my-4"><p className="font-bold border-t border-b border-gray-400 inline-block px-6 py-1">MEMUTUSKAN:</p></div>
        <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RSUD ABDUL MOELOEK TENTANG PEMINDAHAN/MUTASI PEGAWAI NEGERI SIPIL.</p>
        <div className="space-y-2">
          <p><span className="font-bold">KESATU:</span> Memindahtugaskan pegawai yang namanya tersebut di bawah ini:</p>
          <table className="w-full border border-gray-400 text-sm ml-6">
            <tbody>
              {[['Nama', fullName], ['NIP', pegawai?.nip || '___'], ['Pangkat/Gol. Ruang', `${pegawai?.pangkat || '___'} / ${pegawai?.golongan || '___'}`], ['Jabatan', form.jabatanRotasi || pegawai?.jabatan || '___'], ['Unit Kerja Asal', form.unitKerjaAsal || pegawai?.unitKerja || '___'], ['Unit Kerja Tujuan', form.unitKerjaTujuan || '___']].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-300"><td className="px-3 py-1.5 w-48 font-medium border-r border-gray-300">{k}</td><td className="px-3 py-1.5">: {v}</td></tr>
              ))}
            </tbody>
          </table>
          <p><span className="font-bold">KEDUA:</span> Pemindahtugasan sebagaimana dimaksud pada diktum KESATU berlaku terhitung mulai tanggal <span className="font-bold">{fmtDateLong(form.tmtRotasi || '')}</span>.</p>
          <p><span className="font-bold">KETIGA:</span> Kepada yang bersangkutan diberikan hak-hak kepegawaian sesuai peraturan perundang-undangan yang berlaku.</p>
          <p><span className="font-bold">KEEMPAT:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p>
        </div>
      </div>
    </div>
  );
};

// ─── Surat Teguran ─────────────────────────────────────────────────────────
const PreviewTeguran = ({ form, pegawai, isLisan }: { form: SuratForm; pegawai: Pegawai | undefined; isLisan: boolean }) => {
  const fullName = pegawai ? `${pegawai.gelarDepan || ''} ${pegawai.nama}${pegawai.gelarBelakang ? ', ' + pegawai.gelarBelakang : ''}`.trim() : '_______________';
  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-start text-sm">
          <div>
            <p>Nomor : {form.nomorSurat || '___/___/TGR/___/____'}</p>
            <p>Perihal : <span className="font-semibold">Teguran {isLisan ? 'Lisan' : 'Tertulis'}</span></p>
          </div>
          <div className="text-right">
            <p>Bandar Lampung, {fmtDateLong(form.tanggalSurat)}</p>
          </div>
        </div>
      </div>

      <div className="text-sm space-y-4">
        <div>
          <p>Kepada Yth.</p>
          <p className="font-semibold">{fullName}</p>
          <p>NIP. {pegawai?.nip || '_______________'}</p>
          <p>{pegawai?.jabatan || '_______________'}</p>
          <p>di</p>
          <p className="font-semibold">RSUD Abdul Moeloek Provinsi Lampung</p>
        </div>

        <p>Dengan hormat,</p>
        <p>Sehubungan dengan tugas pokok dan fungsi Saudara sebagai {pegawai?.jabatan || '___'} di {pegawai?.unitKerja || '___'}, dengan ini disampaikan bahwa berdasarkan hasil pemantauan dan evaluasi kinerja, Saudara diketahui telah melakukan pelanggaran disiplin berupa:</p>

        <div className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50">
          <p className="font-semibold">{form.pelanggaran || '_______________'}</p>
          {form.tanggalPelanggaran && <p className="text-gray-600 text-xs mt-1">Tanggal kejadian: {fmtDateLong(form.tanggalPelanggaran)}</p>}
        </div>

        <div>
          <p className="font-semibold">Uraian Pelanggaran:</p>
          <p className="mt-1 leading-relaxed">{form.kronologiPelanggaran || '_______________'}</p>
        </div>

        <p>Perbuatan Saudara tersebut melanggar ketentuan {form.dasarPasal || 'kewajiban PNS'} sebagaimana diatur dalam Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil.</p>

        <p>Sehubungan dengan hal tersebut, kepada Saudara diberikan <span className="font-bold text-yellow-700">TEGURAN {isLisan ? 'LISAN' : 'TERTULIS'}</span> sebagai hukuman disiplin tingkat ringan sesuai ketentuan yang berlaku.</p>

        <p>Teguran ini diharapkan menjadi perhatian serius bagi Saudara untuk meningkatkan kedisiplinan dan kinerja dalam melaksanakan tugas. Apabila di kemudian hari Saudara kembali melakukan pelanggaran disiplin, akan dikenakan hukuman disiplin yang lebih berat.</p>

        <p>Demikian disampaikan untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.</p>
      </div>
    </div>
  );
};

// ─── SK Pemberhentian ──────────────────────────────────────────────────────
const PreviewPemberhentian = ({ form, pegawai, isHormat }: { form: SuratForm; pegawai: Pegawai | undefined; isHormat: boolean }) => {
  const fullName = pegawai ? `${pegawai.gelarDepan || ''} ${pegawai.nama}${pegawai.gelarBelakang ? ', ' + pegawai.gelarBelakang : ''}`.trim() : '_______________';
  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-bold text-sm">KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH ABDUL MOELOEK</p>
        <p className="font-bold text-sm">PROVINSI LAMPUNG</p>
        <p className="font-bold text-sm mt-1">NOMOR: {form.nomorSurat || `___/___/${isHormat ? 'SK-PDH' : 'SK-PTDH'}/___/____`}</p>
        <p className="mt-3 font-bold">TENTANG</p>
        <p className="font-bold">{isHormat ? 'PEMBERHENTIAN DENGAN HORMAT' : 'PEMBERHENTIAN TIDAK DENGAN HORMAT'}</p>
        <p className="font-bold">SEBAGAI PEGAWAI NEGERI SIPIL</p>
        <p className="mt-3 font-bold uppercase">DIREKTUR RSUD ABDUL MOELOEK,</p>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-bold">Menimbang:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            {isHormat ? [
              `bahwa ${fullName} (NIP ${pegawai?.nip || '___'}), ${form.alasanPemberhentian?.toLowerCase() || 'telah memenuhi syarat untuk diberhentikan dengan hormat'};`,
              'bahwa berdasarkan ketentuan peraturan perundang-undangan yang berlaku, perlu menetapkan Keputusan tentang Pemberhentian dengan Hormat.',
            ] : [
              `bahwa ${fullName} (NIP ${pegawai?.nip || '___'}) telah terbukti melakukan pelanggaran disiplin berat/tindak pidana yang telah mempunyai kekuatan hukum tetap;`,
              `bahwa berdasarkan ${form.hukumanPidana ? `Putusan Pengadilan ${form.hukumanPidana}` : 'hasil pemeriksaan dan proses hukum yang telah berlangsung'}, yang bersangkutan memenuhi syarat untuk diberhentikan tidak dengan hormat;`,
              'bahwa berdasarkan pertimbangan dimaksud, perlu menetapkan Keputusan tentang Pemberhentian Tidak dengan Hormat.',
            ].map((text, i) => (
              <li key={i} className="flex gap-2"><span>{String.fromCharCode(97 + i)}.</span><span>{text}</span></li>
            ))}
          </ol>
        </div>
        <div>
          <p className="font-bold">Mengingat:</p>
          <ol className="list-none ml-6 space-y-1 mt-1">
            {[
              'Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara, khususnya Pasal 87;',
              isHormat
                ? 'Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil;'
                : 'Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil, khususnya Pasal 8;',
              'Peraturan Daerah Provinsi Lampung tentang Organisasi dan Tata Kerja RSUD Abdul Moeloek.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2"><span>{i + 1}.</span><span>{item}</span></li>
            ))}
          </ol>
        </div>
        <div className="text-center my-4"><p className="font-bold border-t border-b border-gray-400 inline-block px-6 py-1">MEMUTUSKAN:</p></div>
        <p><span className="font-bold">Menetapkan:</span> KEPUTUSAN DIREKTUR RSUD ABDUL MOELOEK TENTANG PEMBERHENTIAN {isHormat ? 'DENGAN HORMAT' : 'TIDAK DENGAN HORMAT'} SEBAGAI PEGAWAI NEGERI SIPIL.</p>
        <div className="space-y-2">
          <p><span className="font-bold">KESATU:</span> {isHormat ? 'Memberhentikan dengan hormat' : 'Memberhentikan tidak dengan hormat'} sebagai Pegawai Negeri Sipil kepada:</p>
          <table className="w-full border border-gray-400 text-sm ml-6">
            <tbody>
              {[['Nama', fullName], ['NIP', pegawai?.nip || '___'], ['Pangkat/Gol. Ruang', `${pegawai?.pangkat || '___'} / ${pegawai?.golongan || '___'}`], ['Jabatan', pegawai?.jabatan || '___'], ['Unit Kerja', pegawai?.unitKerja || '___'], [isHormat ? 'Alasan Pemberhentian' : 'Dasar Pemberhentian', form.alasanPemberhentian || '___']].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-300"><td className="px-3 py-1.5 w-52 font-medium border-r border-gray-300">{k}</td><td className="px-3 py-1.5">: {v}</td></tr>
              ))}
            </tbody>
          </table>
          <p><span className="font-bold">KEDUA:</span> Pemberhentian sebagaimana dimaksud pada diktum KESATU berlaku terhitung mulai tanggal <span className="font-bold">{fmtDateLong(form.tanggalBerlakuPemberhentian || '')}</span>.</p>
          {isHormat
            ? <div className="contents"><p><span className="font-bold">KETIGA:</span> Kepada yang bersangkutan diberikan hak-hak kepegawaian sesuai peraturan perundang-undangan yang berlaku, termasuk hak pensiun dan tunjangan hari tua.</p>
                <p><span className="font-bold">KEEMPAT:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p></div>
            : <div className="contents"><p><span className="font-bold">KETIGA:</span> Yang bersangkutan tidak berhak atas pensiun dan tidak dapat diangkat kembali sebagai PNS sesuai ketentuan UU No. 5 Tahun 2014 Pasal 87 ayat (4).</p>
                <p><span className="font-bold">KEEMPAT:</span> Terhadap keputusan ini, yang bersangkutan dapat mengajukan upaya administratif sesuai ketentuan yang berlaku.</p>
                <p><span className="font-bold">KELIMA:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p></div>
          }
        </div>
      </div>
    </div>
  );
};

// ─── Letter Footer ────────────────────────────────────────────────────────
const LetterFooter = ({ form, isLetter }: { form: SuratForm; isLetter: boolean }) => (
  <div className={`mt-8 ${isLetter ? 'flex justify-end' : 'text-right'}`}>
    <div className="w-72">
      <p className="text-sm">Ditetapkan di Bandar Lampung</p>
      <p className="text-sm">pada tanggal <span>{fmtDateLong(form.tanggalSurat)}</span></p>
      <p className="text-sm mt-2 font-semibold">DIREKTUR RSUD ABDUL MOELOEK</p>
      <p className="text-sm">PROVINSI LAMPUNG,</p>
      <div className="h-20" />
      <p className="text-sm font-bold underline">dr. HERY DJOKO SUBANDRIYO, Sp.OG., M.Kes.</p>
      <p className="text-sm">NIP. 19660721 199703 1 004</p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────
export default function SuratKepegawaian() {
  const { pegawai } = useAppContext();
  const [selected, setSelected] = useState<TemplateSurat>('promosi');
  const [form, setForm] = useState<SuratForm>({ ...EMPTY_FORM });
  const [view, setView] = useState<'form' | 'preview'>('form');
  const printRef = useRef<HTMLDivElement>(null);

  const cfg = templateConfig[selected];
  const selectedPegawai = pegawai.find(p => p.id === form.pegawaiId);

  const handleSelectTemplate = (t: TemplateSurat) => {
    setSelected(t);
    setForm({ ...EMPTY_FORM });
    setView('form');
  };

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Surat Kepegawaian - RSUD Abdul Moeloek</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; background: #fff; }
        .print-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 25mm; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 4pt 8pt; }
        h1, h2, h3, p { margin-bottom: 4pt; }
        .text-center { text-align: center; }
        .font-bold, strong { font-weight: bold; }
        .border-double { border-bottom: 3pt double #000; }
        @media print { .print-page { padding: 15mm 20mm; } }
      </style></head><body>
      <div class="print-page">${printContents}</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
    toast.success('Dokumen siap untuk dicetak');
  };

  const autoNomor = () => {
    const date = new Date(form.tanggalSurat || new Date());
    const prefixMap: Record<TemplateSurat, string> = {
      promosi: 'SK-KJ', demosi: 'SK-HK', rotasi: 'SK-MUT',
      teguran_lisan: 'TGR-L', teguran_tertulis: 'TGR-T',
      pemberhentian_hormat: 'SK-PDH', pemberhentian_tidak_hormat: 'SK-PTDH',
    };
    const n = Math.floor(Math.random() * 900) + 100;
    setForm(f => ({ ...f, nomorSurat: `${n}/800/${prefixMap[selected]}/${toRoman(date.getMonth() + 1)}/${date.getFullYear()}` }));
  };

  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  const renderPreview = () => {
    switch (selected) {
      case 'promosi': return <PreviewPromosi form={form} pegawai={selectedPegawai} />;
      case 'demosi': return <PreviewDemosi form={form} pegawai={selectedPegawai} />;
      case 'rotasi': return <PreviewRotasi form={form} pegawai={selectedPegawai} />;
      case 'teguran_lisan': return <PreviewTeguran form={form} pegawai={selectedPegawai} isLisan={true} />;
      case 'teguran_tertulis': return <PreviewTeguran form={form} pegawai={selectedPegawai} isLisan={false} />;
      case 'pemberhentian_hormat': return <PreviewPemberhentian form={form} pegawai={selectedPegawai} isHormat={true} />;
      case 'pemberhentian_tidak_hormat': return <PreviewPemberhentian form={form} pegawai={selectedPegawai} isHormat={false} />;
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-800">Format Surat Kepegawaian</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generator surat resmi kepegawaian sesuai UU No. 5/2014 & PP No. 94/2021</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        {/* ─── Left: Template Selector ─── */}
        <div className="xl:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pilih Jenis Surat</p>
            </div>
            <div className="p-2 space-y-1">
              {(Object.entries(templateConfig) as [TemplateSurat, typeof templateConfig.promosi][]).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    selected === key
                      ? `${t.activeBg} text-white shadow-sm`
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${selected === key ? 'bg-white/20' : t.bg}`}>
                    <t.icon className={`w-4 h-4 ${selected === key ? 'text-white' : t.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${selected === key ? 'text-white' : 'text-gray-800'}`}>{t.label}</p>
                    <p className={`text-[10px] mt-0.5 leading-tight ${selected === key ? 'text-white/75' : 'text-gray-400'}`}>{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Legal basis info */}
            <div className="px-4 py-3 border-t border-gray-100 bg-blue-50">
              <p className="text-[10px] font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Dasar Hukum</p>
              {cfg.dasar.map((d, i) => (
                <p key={i} className="text-[10px] text-blue-600 flex gap-1 mb-1">
                  <span className="flex-shrink-0">•</span><span>{d}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right: Form + Preview ─── */}
        <div className="flex-1 min-w-0">
          {/* Tab Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['form', 'preview'] as const).map(t => (
                <button key={t} onClick={() => setView(t)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${view === t ? `${cfg.activeBg} text-white` : 'text-gray-500 hover:bg-gray-50'}`}>
                  {t === 'form' ? <Hash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {t === 'form' ? 'Isi Data' : 'Preview Surat'}
                </button>
              ))}
            </div>
            {view === 'preview' && (
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors">
                <Printer className="w-4 h-4" /> Cetak Surat
              </button>
            )}
          </div>

          {/* ─── Form View ─── */}
          {view === 'form' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Template header */}
              <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3 ${cfg.bg}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.activeBg}`}>
                  <cfg.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-gray-500">{cfg.desc}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* ─ Section: Data Surat ─ */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Data Surat
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nomor Surat *</label>
                      <div className="flex gap-2">
                        <input type="text" value={form.nomorSurat} onChange={e => setForm(f => ({ ...f, nomorSurat: e.target.value }))}
                          placeholder="___/800/SK-KJ/I/2026" className={inputCls} />
                        <button onClick={autoNomor} title="Generate otomatis"
                          className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs hover:bg-blue-100 whitespace-nowrap">
                          Auto
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Tanggal Surat *</label>
                      <input type="date" value={form.tanggalSurat} onChange={e => setForm(f => ({ ...f, tanggalSurat: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* ─ Section: Data Pegawai ─ */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Data Pegawai
                  </p>
                  <div>
                    <label className={labelCls}>Pilih Pegawai *</label>
                    <select value={form.pegawaiId} onChange={e => setForm(f => ({ ...f, pegawaiId: e.target.value }))} className={inputCls}>
                      <option value="">— Pilih Pegawai —</option>
                      {pegawai.filter(p => p.statusAktif === 'Aktif').map(p => (
                        <option key={p.id} value={p.id}>{p.gelarDepan || ''} {p.nama} — {p.jabatan} ({p.golongan})</option>
                      ))}
                    </select>
                    {selectedPegawai && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          ['NIP', selectedPegawai.nip],
                          ['Jabatan', selectedPegawai.jabatan],
                          ['Unit Kerja', selectedPegawai.unitKerja],
                          ['Golongan', selectedPegawai.golongan],
                          ['Pangkat', selectedPegawai.pangkat],
                          ['Status', selectedPegawai.statusPegawai],
                        ].map(([k, v]) => (
                          <div key={k}><p className="text-[10px] text-gray-400">{k}</p><p className="text-xs font-medium text-gray-800">{v}</p></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─ Section: Specific Fields per Template ─ */}
                {selected === 'promosi' && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Data Promosi / Jabatan Baru</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className={labelCls}>Jabatan Baru *</label><input type="text" value={form.jabatanBaru || ''} onChange={e => setForm(f => ({ ...f, jabatanBaru: e.target.value }))} placeholder="Nama jabatan yang baru" className={inputCls} /></div>
                      <div><label className={labelCls}>Unit Kerja Baru *</label>
                        <select value={form.unitKerjaBaru || ''} onChange={e => setForm(f => ({ ...f, unitKerjaBaru: e.target.value }))} className={inputCls}>
                          <option value="">Pilih Unit Kerja</option>
                          {UNIT_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>Golongan Baru</label><input type="text" value={form.golonganBaru || ''} onChange={e => setForm(f => ({ ...f, golonganBaru: e.target.value }))} placeholder="III/d" className={inputCls} /></div>
                      <div><label className={labelCls}>TMT Jabatan Baru *</label><input type="date" value={form.tmtJabatanBaru || ''} onChange={e => setForm(f => ({ ...f, tmtJabatanBaru: e.target.value }))} className={inputCls} /></div>
                      <div className="md:col-span-2"><label className={labelCls}>Alasan / Pertimbangan Promosi</label><textarea rows={2} value={form.alasanPromosi || ''} onChange={e => setForm(f => ({ ...f, alasanPromosi: e.target.value }))} placeholder="Contoh: berprestasi tinggi dan memenuhi persyaratan kompetensi jabatan..." className={`${inputCls} resize-none`} /></div>
                    </div>
                  </div>
                )}

                {selected === 'demosi' && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5" /> Data Demosi / Penurunan Jabatan</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className={labelCls}>Jabatan Pengganti (saat hukuman)</label><input type="text" value={form.jabatanDemosi || ''} onChange={e => setForm(f => ({ ...f, jabatanDemosi: e.target.value }))} placeholder="Jabatan setingkat lebih rendah" className={inputCls} /></div>
                      <div><label className={labelCls}>Unit Kerja Selama Hukuman</label>
                        <select value={form.unitKerjaDemosi || ''} onChange={e => setForm(f => ({ ...f, unitKerjaDemosi: e.target.value }))} className={inputCls}>
                          <option value="">Pilih Unit Kerja</option>
                          {UNIT_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>TMT Berlaku *</label><input type="date" value={form.tmtDemosi || ''} onChange={e => setForm(f => ({ ...f, tmtDemosi: e.target.value }))} className={inputCls} /></div>
                      <div className="md:col-span-2"><label className={labelCls}>Alasan / Pelanggaran *</label><textarea rows={3} value={form.alasanDemosi || ''} onChange={e => setForm(f => ({ ...f, alasanDemosi: e.target.value }))} placeholder="Uraikan pelanggaran yang dilakukan dan dasar penjatuhan hukuman penurunan jabatan..." className={`${inputCls} resize-none`} /></div>
                    </div>
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-2">
                      <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-700">Hukuman penurunan jabatan termasuk hukuman disiplin tingkat berat. Jangka waktu berlaku: 12 bulan, setelah itu dapat dikembalikan ke jabatan semula apabila menunjukkan peningkatan kinerja (PP No. 94/2021 Pasal 8).</p>
                    </div>
                  </div>
                )}

                {selected === 'rotasi' && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Data Mutasi / Rotasi</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className={labelCls}>Unit Kerja Asal</label>
                        <select value={form.unitKerjaAsal || ''} onChange={e => setForm(f => ({ ...f, unitKerjaAsal: e.target.value }))} className={inputCls}>
                          <option value="">{selectedPegawai?.unitKerja || 'Pilih Unit Kerja'}</option>
                          {UNIT_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>Unit Kerja Tujuan *</label>
                        <select value={form.unitKerjaTujuan || ''} onChange={e => setForm(f => ({ ...f, unitKerjaTujuan: e.target.value }))} className={inputCls}>
                          <option value="">Pilih Unit Kerja</option>
                          {UNIT_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>Jabatan di Unit Tujuan</label><input type="text" value={form.jabatanRotasi || ''} onChange={e => setForm(f => ({ ...f, jabatanRotasi: e.target.value }))} placeholder={selectedPegawai?.jabatan || 'Nama jabatan di unit tujuan'} className={inputCls} /></div>
                      <div><label className={labelCls}>TMT Berlaku *</label><input type="date" value={form.tmtRotasi || ''} onChange={e => setForm(f => ({ ...f, tmtRotasi: e.target.value }))} className={inputCls} /></div>
                      <div className="md:col-span-2"><label className={labelCls}>Alasan Mutasi</label><textarea rows={2} value={form.alasanRotasi || ''} onChange={e => setForm(f => ({ ...f, alasanRotasi: e.target.value }))} placeholder="Untuk kepentingan dinas / penyegaran organisasi / optimalisasi pelayanan..." className={`${inputCls} resize-none`} /></div>
                    </div>
                  </div>
                )}

                {(selected === 'teguran_lisan' || selected === 'teguran_tertulis') && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Data Pelanggaran</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><label className={labelCls}>Jenis Pelanggaran *</label>
                        <select value={form.pelanggaran || ''} onChange={e => setForm(f => ({ ...f, pelanggaran: e.target.value }))} className={inputCls}>
                          <option value="">Pilih jenis pelanggaran</option>
                          {['Tidak masuk kerja tanpa izin','Terlambat masuk kerja lebih dari 10 kali dalam sebulan','Tidak mematuhi instruksi atasan','Tidak menggunakan seragam/APD sesuai ketentuan','Tidak mengisi absensi sesuai ketentuan','Perilaku tidak profesional kepada pasien/rekan kerja','Meninggalkan tugas tanpa izin','Melalaikan tugas yang menjadi tanggung jawabnya'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <input type="text" value={form.pelanggaran?.startsWith('Lain') || !['Tidak masuk kerja','Terlambat','Tidak mematuhi','Tidak menggunakan','Tidak mengisi','Perilaku','Meninggalkan','Melalaikan'].some(k => form.pelanggaran?.includes(k)) ? form.pelanggaran || '' : ''} onChange={e => setForm(f => ({ ...f, pelanggaran: e.target.value }))} placeholder="Atau ketik pelanggaran lainnya..." className={`${inputCls} mt-2`} />
                      </div>
                      <div><label className={labelCls}>Tanggal Pelanggaran</label><input type="date" value={form.tanggalPelanggaran || ''} onChange={e => setForm(f => ({ ...f, tanggalPelanggaran: e.target.value }))} className={inputCls} /></div>
                      <div><label className={labelCls}>Pasal yang Dilanggar</label><input type="text" value={form.dasarPasal || ''} onChange={e => setForm(f => ({ ...f, dasarPasal: e.target.value }))} placeholder="PP No. 94 Tahun 2021 Pasal ..." className={inputCls} /></div>
                      <div className="md:col-span-2"><label className={labelCls}>Kronologi Pelanggaran *</label><textarea rows={4} value={form.kronologiPelanggaran || ''} onChange={e => setForm(f => ({ ...f, kronologiPelanggaran: e.target.value }))} placeholder="Uraikan kronologi kejadian/pelanggaran secara singkat, jelas, dan faktual..." className={`${inputCls} resize-none`} /></div>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-2">
                      <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">Teguran {selected === 'teguran_lisan' ? 'lisan' : 'tertulis'} adalah hukuman disiplin tingkat ringan berdasarkan PP No. 94/2021 Pasal 7 ayat (2). Dokumen teguran wajib didokumentasikan dalam berkas kepegawaian pegawai yang bersangkutan.</p>
                    </div>
                  </div>
                )}

                {selected === 'pemberhentian_hormat' && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><UserMinus className="w-3.5 h-3.5" /> Data Pemberhentian dengan Hormat</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><label className={labelCls}>Alasan Pemberhentian *</label>
                        <select value={form.alasanPemberhentian || ''} onChange={e => setForm(f => ({ ...f, alasanPemberhentian: e.target.value }))} className={inputCls}>
                          <option value="">Pilih alasan pemberhentian</option>
                          {ALASAN_PEMBERHENTIAN_HORMAT.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>Tanggal Berlaku *</label><input type="date" value={form.tanggalBerlakuPemberhentian || ''} onChange={e => setForm(f => ({ ...f, tanggalBerlakuPemberhentian: e.target.value }))} className={inputCls} /></div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-700">Pegawai yang diberhentikan dengan hormat berhak atas pensiun dan tunjangan hari tua sesuai UU No. 5/2014 Pasal 87 ayat (1)-(3) dan PP No. 11/2017.</p>
                    </div>
                  </div>
                )}

                {selected === 'pemberhentian_tidak_hormat' && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><ShieldOff className="w-3.5 h-3.5" /> Data Pemberhentian Tidak dengan Hormat (PTDH)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><label className={labelCls}>Dasar/Alasan PTDH *</label>
                        <select value={form.alasanPemberhentian || ''} onChange={e => setForm(f => ({ ...f, alasanPemberhentian: e.target.value }))} className={inputCls}>
                          <option value="">Pilih dasar PTDH</option>
                          {ALASAN_PTH.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>Nomor Putusan Pengadilan (jika ada)</label><input type="text" value={form.hukumanPidana || ''} onChange={e => setForm(f => ({ ...f, hukumanPidana: e.target.value }))} placeholder="No. Putusan / Nama Pengadilan / Tanggal Putusan" className={inputCls} /></div>
                      <div><label className={labelCls}>Tanggal Berlaku PTDH *</label><input type="date" value={form.tanggalBerlakuPemberhentian || ''} onChange={e => setForm(f => ({ ...f, tanggalBerlakuPemberhentian: e.target.value }))} className={inputCls} /></div>
                    </div>
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <ShieldOff className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-700">Konsekuensi PTDH (UU No. 5/2014 Pasal 87 ayat 4):</p>
                          <ul className="text-xs text-red-600 mt-1 space-y-0.5 list-disc list-inside">
                            <li>Tidak berhak atas pensiun dan tunjangan hari tua</li>
                            <li>Tidak dapat diangkat kembali sebagai PNS</li>
                            <li>Wajib mengembalikan kerugian negara (jika ada)</li>
                            <li>Dapat dituntut secara pidana dan/atau perdata</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">* Field wajib diisi sebelum mencetak</p>
                  <button onClick={() => setView('preview')}
                    className={`flex items-center gap-2 px-6 py-2.5 ${cfg.activeBg} text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity`}>
                    <Eye className="w-4 h-4" /> Lihat Preview Surat <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Preview View ─── */}
          {view === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badgeColor}`}>{cfg.label}</span>
                  {form.nomorSurat && <span className="text-xs text-gray-400 font-mono">{form.nomorSurat}</span>}
                </div>
                <button onClick={() => setView('form')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Kembali Edit
                </button>
              </div>

              {/* Letter Document */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Document toolbar */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Pratinjau Dokumen — Format A4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs hover:bg-gray-900 transition-colors">
                      <Printer className="w-3.5 h-3.5" /> Cetak / PDF
                    </button>
                  </div>
                </div>

                {/* A4 Letter */}
                <div className="p-6 bg-gray-100 overflow-auto">
                  <div
                    ref={printRef}
                    className="bg-white mx-auto shadow-lg"
                    style={{ width: '210mm', minHeight: '297mm', padding: '20mm 25mm', fontFamily: "'Times New Roman', Times, serif", fontSize: '11pt', lineHeight: '1.5', color: '#000' }}
                  >
                    <LetterHeader />
                    {renderPreview()}
                    <LetterFooter form={form} isLetter={true} />

                    {/* Tembusan section */}
                    <div className="mt-8 pt-4 border-t border-gray-300">
                      <p className="text-sm"><span className="font-bold">Tembusan:</span></p>
                      <ol className="text-sm ml-6 mt-1 space-y-0.5">
                        <li>1. Kepala BKD/BKN Provinsi Lampung;</li>
                        <li>2. Kepala Bagian Umum dan Kepegawaian RSUD Abdul Moeloek;</li>
                        <li>3. Kepala Unit Kerja yang bersangkutan;</li>
                        <li>4. Pegawai yang bersangkutan (untuk diketahui dan dilaksanakan).</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Validation hints */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 font-medium mb-2">Kelengkapan Data:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Nomor Surat', ok: !!form.nomorSurat },
                      { label: 'Tanggal', ok: !!form.tanggalSurat },
                      { label: 'Pegawai', ok: !!form.pegawaiId },
                      ...(selected === 'promosi' ? [{ label: 'Jabatan Baru', ok: !!form.jabatanBaru }, { label: 'Unit Baru', ok: !!form.unitKerjaBaru }, { label: 'TMT', ok: !!form.tmtJabatanBaru }] : []),
                      ...(selected === 'demosi' ? [{ label: 'Alasan', ok: !!form.alasanDemosi }, { label: 'TMT', ok: !!form.tmtDemosi }] : []),
                      ...(selected === 'rotasi' ? [{ label: 'Unit Tujuan', ok: !!form.unitKerjaTujuan }, { label: 'TMT', ok: !!form.tmtRotasi }] : []),
                      ...(selected === 'teguran_lisan' || selected === 'teguran_tertulis' ? [{ label: 'Pelanggaran', ok: !!form.pelanggaran }, { label: 'Kronologi', ok: !!form.kronologiPelanggaran }] : []),
                      ...(selected === 'pemberhentian_hormat' || selected === 'pemberhentian_tidak_hormat' ? [{ label: 'Alasan', ok: !!form.alasanPemberhentian }, { label: 'Tgl Berlaku', ok: !!form.tanggalBerlakuPemberhentian }] : []),
                    ].map(({ label, ok }) => (
                      <span key={label} className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {ok ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
