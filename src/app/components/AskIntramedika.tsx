import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Sparkles, ChevronDown, RefreshCw,
  MessageSquare, Minimize2, Bot, User,
  BookOpen, Clock, TrendingUp, FileText,
  Shield, GraduationCap, Calendar, DollarSign,
  Mic, Paperclip, ThumbsUp, ThumbsDown, Copy, RotateCcw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  feedback?: 'up' | 'down' | null;
  suggestions?: string[];
}

interface QuickTopic {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  query: string;
}

// ─── Dummy Knowledge Base ────────────────────────────────────────────────────
const KNOWLEDGE_BASE: Record<string, { answer: string; suggestions?: string[] }> = {
  cuti: {
    answer: `**Manajemen Cuti ASN** (PP No. 11/2017)\n\nJenis-jenis cuti yang tersedia:\n\n📅 **Cuti Tahunan** – 12 hari kerja/tahun (dapat digabung maks. 24 hari)\n🤒 **Cuti Sakit** – Maks. 1 tahun + perpanjangan 6 bulan jika diperlukan\n🤰 **Cuti Melahirkan** – 3 bulan (persalinan 1–3)\n✈️ **Cuti Besar** – 3 bulan setelah 6 tahun masa kerja\n⛪ **Cuti Alasan Penting** – Untuk keperluan ibadah haji/keluarga\n📋 **Cuti di Luar Tanggungan Negara** – Maks. 3 tahun (dengan persetujuan BKN)\n\nUntuk mengajukan cuti, masuk ke modul **Manajemen Cuti** → Klik tombol **+ Ajukan Cuti**.`,
    suggestions: ['Berapa sisa cuti saya?', 'Prosedur pengajuan cuti besar', 'Cuti melahirkan PPPK'],
  },
  pangkat: {
    answer: `**Kenaikan Pangkat ASN** (PP No. 11/2017 Pasal 66–83)\n\nJenis Kenaikan Pangkat:\n\n⬆️ **Reguler** – Setiap 4 tahun jika memenuhi syarat nilai SKP minimal Baik\n🏆 **Pilihan** – Berdasarkan prestasi kerja luar biasa (maks. 3x)\n📚 **Anumerta** – Bagi PNS yang meninggal dalam/karena tugas\n🎓 **Penyesuaian Ijazah** – Jika menyelesaikan pendidikan lebih tinggi\n\n**Syarat umum:**\n- Nilai SKP 2 tahun terakhir ≥ Baik\n- Telah menduduki pangkat selama 4 tahun\n- Tidak sedang menjalani hukuman disiplin\n- Tersedia formasi/lowongan\n\nCek status di modul **Kenaikan Pangkat** → Tab **Periode Berikutnya**.`,
    suggestions: ['Syarat kenaikan pangkat pilihan', 'Dokumen yang diperlukan', 'Pangkat fungsional dokter'],
  },
  skp: {
    answer: `**SKP – Sasaran Kinerja Pegawai** (PermenPAN-RB No. 6/2022)\n\nSKP terdiri dari:\n\n📊 **Rencana Kinerja** – Disusun awal tahun/periode\n📈 **Realisasi** – Dicatat setiap bulan/triwulan\n⭐ **Penilaian** – Oleh Pejabat Penilai setiap semester & tahunan\n\n**Kategori Nilai SKP 2022:**\n- Sangat Baik (110% ke atas)\n- Baik (90%–109%)\n- Cukup (76%–89%)\n- Kurang (61%–75%)\n- Sangat Kurang (< 60%)\n\n**Komponen Penilaian:**\n- Hasil kerja (kuantitatif & kualitatif)\n- Perilaku kerja (orientasi pelayanan, komitmen, inisiatif)\n\nLihat SKP Anda di modul **SKP & Penilaian Kinerja**.`,
    suggestions: ['Cara input realisasi SKP', 'SKP tenaga medis fungsional', 'Nilai SKP untuk kenaikan pangkat'],
  },
  absensi: {
    answer: `**Sistem Presensi RSUD Abdul Moeloek**\n\nJam kerja berlaku:\n\n🏥 **Shift Pagi** – 07.00 – 14.00 WIB\n🌙 **Shift Sore** – 14.00 – 21.00 WIB\n🌟 **Shift Malam** – 21.00 – 07.00 WIB\n💼 **Non-Shift (Adm)** – 07.30 – 15.30 WIB\n\n**Toleransi Keterlambatan:** 7,5 menit\n**Presensi:** Finger print + aplikasi SIAP\n\nKetidakhadiran tanpa keterangan akan mempengaruhi:\n- Tunjangan kinerja (potongan per hari)\n- Nilai perilaku SKP\n- Remunerasi bulan berjalan\n\nLihat rekap di modul **Presensi / Absensi**.`,
    suggestions: ['Prosedur ijin tidak hadir', 'Cara koreksi absensi', 'Dampak absen terhadap tunjangan'],
  },
  gaji: {
    answer: `**Komponen Penggajian ASN** (PP No. 15/2019)\n\nKomponen penghasilan PNS RSUD Abdul Moeloek:\n\n💰 **Gaji Pokok** – Sesuai golongan/ruang\n📌 **Tunjangan Istri/Suami** – 10% gaji pokok\n👶 **Tunjangan Anak** – 2% × maks. 2 anak\n🏠 **Tunjangan Pangan** – Rp 10.000/hari (maks. 22 hari)\n⚕️ **Tunjangan Jabatan Fungsional** – Sesuai jenjang\n📊 **Remunerasi/TPP** – Berdasarkan kinerja dan kehadiran\n🏆 **Tunjangan Profesi** – Untuk dokter, perawat, dll.\n\n**Potongan:**\n- Iuran JKN: 1% gaji pokok\n- Iuran JHT: 3% gaji pokok\n- PPh 21: Sesuai PTKP\n\nDetail slip gaji di modul **Penggajian & Tunjangan**.`,
    suggestions: ['Cara hitung TPP/remunerasi', 'Gaji PPPK vs PNS', 'Potongan iuran pensiun'],
  },
  disiplin: {
    answer: `**Disiplin Pegawai ASN** (PP No. 94/2021)\n\nTingkatan Hukuman Disiplin:\n\n⚠️ **Ringan:**\n- Teguran lisan\n- Teguran tertulis\n- Pernyataan tidak puas\n\n🔴 **Sedang:**\n- Penundaan kenaikan gaji berkala\n- Penundaan kenaikan pangkat\n- Penurunan pangkat setingkat lebih rendah (1 tahun)\n\n🚫 **Berat:**\n- Penurunan pangkat setingkat lebih rendah (3 tahun)\n- Pemindahan dalam rangka penurunan jabatan\n- Pembebasan dari jabatan\n- **Pemberhentian dengan hormat tidak atas permintaan sendiri**\n- Pemberhentian tidak dengan hormat\n\nLihat riwayat disiplin di modul **Disiplin Pegawai**.`,
    suggestions: ['Prosedur pemeriksaan disiplin', 'Hak pegawai yang dikenai hukuman', 'Banding hukuman disiplin'],
  },
  diklat: {
    answer: `**Program Diklat & Pengembangan Kompetensi**\n\nJenis pelatihan yang tersedia di RSUD Abdul Moeloek:\n\n🎓 **Diklat Prajabatan** – Wajib CPNS/CPPPK (Latsar BASNas/BPSDM)\n📚 **Diklat Teknis** – Sesuai bidang tugas (klinis & non-klinis)\n🏅 **Diklat Fungsional** – Pengangkatan & kenaikan jenjang\n💼 **Diklat Kepemimpinan** – PKP (Tk. III) & PKA (Tk. II)\n🌐 **Pendidikan Formal** – Tugas/izin belajar\n🏥 **In-House Training** – BCLS, BTCLS, K3RS, PPI\n\n**Kewajiban tahunan:**\n- Minimal 20 JP pelatihan/tahun (ASN)\n- Semua sertifikat wajib diunggah ke SIMKA/SIASN\n\nDaftar diklat tersedia di modul **Diklat & Kompetensi**.`,
    suggestions: ['Cara daftar diklat online', 'Syarat tugas belajar', 'Upload sertifikat diklat'],
  },
  pppk: {
    answer: `**PPPK – Pegawai Pemerintah dengan Perjanjian Kerja** (UU No. 5/2014 & PP No. 49/2018)\n\nHak dan ketentuan PPPK:\n\n📜 **Kontrak:** 1–5 tahun, dapat diperpanjang\n💰 **Gaji:** Setara PNS golongan yang sama\n🏥 **JKN:** Iuran ditanggung pemberi kerja\n📋 **SKP:** Wajib seperti PNS\n❌ **Tidak mendapat:** Pensiun, kenaikan pangkat reguler\n✅ **Mendapat:** Cuti tahunan, sakit, melahirkan\n\n**Berakhirnya PPPK:**\n- Habis masa perjanjian\n- Meninggal dunia\n- Atas permintaan sendiri\n- Sebab-sebab tertentu (pelanggaran)\n\n**Konversi ke PNS:** Saat ini belum diatur, kecuali ikut seleksi umum.`,
    suggestions: ['Perpanjangan kontrak PPPK', 'Hak cuti PPPK', 'Seleksi PPPK 2026'],
  },
  pensiun: {
    answer: `**Batas Usia Pensiun (BUP) ASN** (PP No. 11/2017)\n\nBatas usia pensiun berdasarkan jabatan:\n\n👴 **Jabatan Pelaksana** – 58 tahun\n👔 **Jabatan Administrator & Pengawas** – 58 tahun\n🎯 **Jabatan Pimpinan Tinggi** – 60 tahun\n⚕️ **JF Ahli Utama** – 65 tahun\n🩺 **Dokter Spesialis / Konsultan** – 65 tahun\n👩‍⚕️ **Perawat / Bidan (Ahli Muda/Pertama)** – 58 tahun\n🔬 **Pranata Lab, Radiografer, dll.** – 58–60 tahun\n\n**Pensiun Dini:** Usia 50 tahun + 20 tahun masa kerja\n**Uang Pensiun:** Dibayar PT Taspen setiap bulan\n\nMonitor pegawai mendekati BUP di modul **Data Pegawai** → Filter Status.`,
    suggestions: ['Dokumen pengurusan pensiun', 'Besaran uang pensiun', 'Pensiun janda/duda'],
  },
  surat: {
    answer: `**Layanan Surat Kepegawaian Digital**\n\nJenis surat yang dapat diterbitkan melalui sistem:\n\n📄 **Surat Keterangan Aktif Bekerja** – Proses 1 hari kerja\n📋 **Surat Keterangan Penghasilan** – Untuk keperluan KPR/kredit\n🎖️ **Surat Keterangan Masa Kerja** – Riwayat dinas lengkap\n🏦 **Surat Rekomendasi Bank** – Pembukaan rekening dinas\n📑 **SK Pengangkatan Jabatan** – Dari BKD/BKN\n🏥 **Surat Penugasan** – Diklat/seminar/konferensi\n✈️ **Surat Ijin Bepergian** – Ke luar kota/negeri\n\n**Pejabat Penandatangan:**\n*dr. IMAM GHOZALI, Sp.An., M.Kes.*\nNIP. 19680415 199703 1 001\n\nBuat surat di modul **Surat Kepegawaian** → Pilih jenis surat.`,
    suggestions: ['Cara cetak SK jabatan', 'Surat keterangan untuk BPJS', 'Status permohonan surat'],
  },
};

const GREETINGS = [
  'Halo! Saya **Ask INTRAMEDIKA**, asisten digital HR RSUD Abdul Moeloek 🏥\n\nSaya dapat membantu Anda dengan:\n- Informasi **cuti & absensi**\n- Proses **kenaikan pangkat**\n- Penilaian **SKP/kinerja**\n- Regulasi **kepegawaian ASN**\n- Dan banyak lagi!\n\nAda yang ingin Anda tanyakan?',
];

const QUICK_TOPICS: QuickTopic[] = [
  { id: 'cuti', icon: Calendar, label: 'Cuti & Izin', color: 'bg-orange-50 text-orange-600 border-orange-200', query: 'Jelaskan jenis-jenis cuti ASN' },
  { id: 'pangkat', icon: TrendingUp, label: 'Kenaikan Pangkat', color: 'bg-green-50 text-green-600 border-green-200', query: 'Syarat kenaikan pangkat reguler' },
  { id: 'skp', icon: FileText, label: 'SKP & Kinerja', color: 'bg-purple-50 text-purple-600 border-purple-200', query: 'Cara penilaian SKP 2022' },
  { id: 'absensi', icon: Clock, label: 'Presensi', color: 'bg-blue-50 text-blue-600 border-blue-200', query: 'Aturan absensi dan jam kerja' },
  { id: 'gaji', icon: DollarSign, label: 'Penggajian', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', query: 'Komponen gaji dan tunjangan ASN' },
  { id: 'disiplin', icon: Shield, label: 'Disiplin', color: 'bg-red-50 text-red-600 border-red-200', query: 'Tingkatan hukuman disiplin ASN' },
  { id: 'diklat', icon: GraduationCap, label: 'Diklat', color: 'bg-teal-50 text-teal-600 border-teal-200', query: 'Program diklat yang tersedia' },
  { id: 'surat', icon: BookOpen, label: 'Surat Dinas', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', query: 'Layanan surat kepegawaian' },
];

// ─── Helper: find best answer ─────────────────────────────────────────────────
function findAnswer(query: string): { answer: string; suggestions?: string[] } {
  const q = query.toLowerCase();
  const keywordMap: Record<string, string> = {
    cuti: 'cuti', izin: 'cuti', libur: 'cuti',
    pangkat: 'pangkat', kenaikan: 'pangkat', golongan: 'pangkat',
    skp: 'skp', kinerja: 'skp', sasaran: 'skp', penilaian: 'skp',
    absensi: 'absensi', presensi: 'absensi', hadir: 'absensi', telat: 'absensi', terlambat: 'absensi',
    gaji: 'gaji', penghasilan: 'gaji', tunjangan: 'gaji', remunerasi: 'gaji', slip: 'gaji',
    disiplin: 'disiplin', hukuman: 'disiplin', pelanggaran: 'disiplin',
    diklat: 'diklat', pelatihan: 'diklat', kompetensi: 'diklat', sertifikat: 'diklat',
    pppk: 'pppk', perjanjian: 'pppk', kontrak: 'pppk',
    pensiun: 'pensiun', bup: 'pensiun', purnatugas: 'pensiun',
    surat: 'surat', sk: 'surat', kepegawaian: 'surat',
  };

  for (const [keyword, key] of Object.entries(keywordMap)) {
    if (q.includes(keyword)) {
      return KNOWLEDGE_BASE[key];
    }
  }

  return {
    answer: `Terima kasih atas pertanyaan Anda tentang: **"${query}"**\n\nSaat ini saya sedang mencari informasi yang paling relevan. Untuk pertanyaan spesifik terkait kepegawaian, silakan pilih topik dari menu cepat di bawah, atau hubungi langsung:\n\n📞 **Subbag Kepegawaian & SDM**\nRSUD Abdul Moeloek, Lantai 2 Gedung Administrasi\nTelp: (0721) 703312 ext. 101\n⏰ Jam layanan: 07.30–15.30 WIB`,
    suggestions: ['Cuti tahunan ASN', 'Kenaikan pangkat reguler', 'Cara mengajukan SKP'],
  };
}

// ─── Markdown-like renderer ───────────────────────────────────────────────────
function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    // Bold text
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{part}</strong> : part
    );
    if (line.trim() === '') return <br key={i} />;
    return <div key={i} className="leading-relaxed">{rendered}</div>;
  });
}

// ─── AskIntramedika Component ─────────────────────────────────────────────────
export default function AskIntramedika() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: GREETINGS[0],
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickTopics, setShowQuickTopics] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Pulse animation for button when closed
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setPulseCount(p => (p + 1) % 100);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, messages, scrollToBottom]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setShowQuickTopics(false);
    setIsTyping(true);

    // Simulate AI typing delay
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const result = findAnswer(text);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        suggestions: result.suggestions,
        feedback: null,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m)
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, ''));
  };

  const handleReset = () => {
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: GREETINGS[0],
      timestamp: new Date(),
    }]);
    setShowQuickTopics(true);
    setIsTyping(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNewMessage(false);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-14 w-80' : 'w-[380px] h-[600px] max-h-[85vh]'
          }`}
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Ask INTRAMEDIKA</p>
                <p className="text-blue-200 text-[10px] leading-tight">
                  {isTyping ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-pulse">●</span> Mengetik...
                    </span>
                  ) : (
                    'Asisten Digital Kepegawaian'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset percakapan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title={isMinimized ? 'Perbesar' : 'Perkecil'}
              >
                {isMinimized ? <ChevronDown className="w-3.5 h-3.5 rotate-180" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="contents">
              {/* Messages */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50"
                style={{ scrollbarWidth: 'thin' }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-[#1e3a5f] to-blue-600 text-white'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5" />
                        : <Bot className="w-3.5 h-3.5" />
                      }
                    </div>

                    <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-700 rounded-tl-sm border border-gray-100 shadow-sm'
                      }`}>
                        <div className="space-y-0.5">
                          {renderContent(msg.content)}
                        </div>
                      </div>

                      {/* Timestamp & actions */}
                      <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(msg.content)}
                              className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              title="Salin"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-0.5 rounded transition-colors ${msg.feedback === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                              title="Jawaban membantu"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-0.5 rounded transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              title="Jawaban tidak membantu"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Suggestions */}
                      {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {msg.suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(s)}
                              className="px-2.5 py-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Topics */}
              {showQuickTopics && (
                <div className="px-4 py-3 bg-white border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide">Topik Populer</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => sendMessage(topic.query)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all hover:scale-105 active:scale-95 ${topic.color}`}
                      >
                        <topic.icon className="w-4 h-4" />
                        <span className="text-center leading-tight">{topic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0"
              >
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ketik pertanyaan kepegawaian..."
                    className="w-full pl-3 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    disabled={isTyping}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Footer */}
              <div className="px-4 pb-2 text-center">
                <p className="text-[9px] text-gray-400">
                  Ask INTRAMEDIKA • Powered by HR APP RSUD Abdul Moeloek
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <div className="relative">
        {/* Pulse rings */}
        {!isOpen && (
          <div className="contents">
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
            <span className="absolute -inset-1 rounded-full bg-blue-400 animate-pulse opacity-10" />
          </div>
        )}

        {/* New message badge */}
        {!isOpen && hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-[8px] flex items-center justify-center font-bold z-10">
            1
          </span>
        )}

        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2563eb] shadow-xl hover:shadow-2xl text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ boxShadow: '0 8px 32px rgba(37, 99, 235, 0.45)' }}
          title="Ask INTRAMEDIKA – Asisten Digital Kepegawaian"
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <div className="contents">
              <Sparkles className="w-6 h-6" />
              {/* Tooltip */}
              <div className="absolute right-16 bottom-1 bg-[#1e3a5f] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none">
                Ask INTRAMEDIKA
              </div>
            </div>
          )}
        </button>

        {/* Label tooltip on hover */}
        {!isOpen && (
          <div className="absolute right-16 bottom-3 pointer-events-none">
            <div className="bg-[#1e3a5f] text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-300" />
              Ask INTRAMEDIKA
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
