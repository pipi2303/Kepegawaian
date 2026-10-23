<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Kontrak PPPK</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; }
    .page { width: 100%; padding: 20mm 25mm; }
    .kop { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .kop-table { width: 100%; border-collapse: collapse; }
    .kop-table td { vertical-align: middle; }
    .logo-cell { width: 80px; }
    .logo-box { width: 65px; height: 65px; border: 2px dashed #666; text-align: center;
                font-size: 7pt; color: #666; display: table-cell; vertical-align: middle; }
    .title-cell { padding-left: 12px; }
    .rs-name { font-size: 14pt; font-weight: bold; }
    .rs-sub { font-size: 10pt; }
    .rs-info { font-size: 9pt; color: #333; margin-top: 3px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .section { margin-bottom: 14px; line-height: 1.8; }
    .pasal { font-weight: bold; margin-top: 16px; margin-bottom: 6px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 8px 0 8px 20px; }
    .data-table td { padding: 2px 8px; vertical-align: top; }
    .data-table .label { width: 200px; }
    .ttd-row { width: 100%; border-collapse: collapse; margin-top: 40px; }
    .ttd-row td { text-align: center; padding: 0 10px; vertical-align: top; width: 50%; }
    .cap-box { border: 1px dashed #999; height: 70px; line-height: 70px; color: #999;
               font-size: 9pt; text-align: center; margin: 10px 0; }
    .materai-box { border: 1px dashed #999; height: 50px; width: 50px; line-height: 50px; color: #999;
                   font-size: 7pt; text-align: center; margin: 0 auto 10px; }
    .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 6px;
              font-size: 8pt; color: #666; text-align: center; }
</style>
</head>
<body>
<div class="page">
    <!-- KOP SURAT -->
    <div class="kop">
        <table class="kop-table">
            <tr>
                <td class="logo-cell"><div class="logo-box">LOGO RS</div></td>
                <td class="title-cell">
                    <div class="rs-name">{{ $pengaturan['nama_rs'] ?? 'RUMAH SAKIT' }}</div>
                    <div class="rs-sub">{{ $pengaturan['kelas_rs'] ?? '' }}</div>
                    <div class="rs-info">{{ $pengaturan['alamat_rs'] ?? '' }}</div>
                    <div class="rs-info">Telp. {{ $pengaturan['no_telp_rs'] ?? '-' }} &nbsp;|&nbsp; Email: {{ $pengaturan['email_rs'] ?? '-' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- JUDUL -->
    <div class="center section">
        <div class="bold" style="font-size:12pt; letter-spacing:1px;">PERJANJIAN KERJA</div>
        <div class="bold" style="font-size:11pt;">PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA</div>
        <div style="margin-top:4px;">Nomor: {{ $nomorSurat }}</div>
    </div>

    <!-- PARA PIHAK -->
    <div class="section">
        <p>Pada hari ini, {{ now()->translatedFormat('l, d F Y') }}, yang bertanda tangan di bawah ini:</p>
        <br>
        <p><strong>PIHAK PERTAMA:</strong></p>
        <table class="data-table">
            <tr><td class="label">Nama</td><td>: {{ $pengaturan['direktur_rs'] ?? 'Direktur' }}</td></tr>
            <tr><td class="label">Jabatan</td><td>: Direktur {{ $pengaturan['nama_rs'] ?? 'Rumah Sakit' }}</td></tr>
            <tr><td class="label">Alamat Instansi</td><td>: {{ $pengaturan['alamat_rs'] ?? '-' }}</td></tr>
        </table>
        <br>
        <p><strong>PIHAK KEDUA:</strong></p>
        <table class="data-table">
            <tr><td class="label">Nama</td><td>: {{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</td></tr>
            <tr><td class="label">NIP</td><td>: {{ $pegawai->nip }}</td></tr>
            <tr><td class="label">Nomor Identitas</td><td>: {{ $pegawai->nik ?? '-' }}</td></tr>
            <tr><td class="label">Tempat/Tanggal Lahir</td><td>: {{ $pegawai->tempat_lahir ?? '-' }}, {{ $pegawai->tanggal_lahir ? \Carbon\Carbon::parse($pegawai->tanggal_lahir)->translatedFormat('d F Y') : '-' }}</td></tr>
            <tr><td class="label">Alamat</td><td>: {{ $pegawai->alamat ?? '-' }}</td></tr>
        </table>
    </div>

    <!-- PASAL 1 -->
    <div class="section">
        <p class="pasal">Pasal 1 &ndash; Jabatan dan Penempatan</p>
        <p>Pihak Pertama mengangkat Pihak Kedua sebagai Pegawai Pemerintah dengan Perjanjian Kerja (PPPK) dengan ketentuan:</p>
        <table class="data-table">
            <tr><td class="label">Jabatan</td><td>: {{ $pegawai->jabatan }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>: {{ $pegawai->unit_kerja }}</td></tr>
            <tr><td class="label">Golongan</td><td>: {{ $pegawai->golongan ?? '-' }}</td></tr>
        </table>
    </div>

    <!-- PASAL 2 -->
    <div class="section">
        <p class="pasal">Pasal 2 &ndash; Masa Perjanjian Kerja</p>
        @if($kontrak)
        <table class="data-table">
            <tr><td class="label">Tanggal Mulai</td><td>: {{ \Carbon\Carbon::parse($kontrak->tanggal_mulai)->translatedFormat('d F Y') }}</td></tr>
            <tr><td class="label">Tanggal Berakhir</td><td>: {{ \Carbon\Carbon::parse($kontrak->tanggal_selesai)->translatedFormat('d F Y') }}</td></tr>
            <tr><td class="label">Durasi</td><td>: {{ $kontrak->durasi_tahun ?? 1 }} tahun</td></tr>
        </table>
        @else
        <p>Perjanjian kerja ini berlaku selama <strong>1 (satu) tahun</strong> terhitung sejak tanggal penandatanganan dan dapat diperpanjang berdasarkan evaluasi kinerja.</p>
        @endif
    </div>

    <!-- PASAL 3 -->
    <div class="section">
        <p class="pasal">Pasal 3 &ndash; Gaji dan Tunjangan</p>
        <p>Pihak Kedua berhak atas gaji dan tunjangan sesuai peraturan perundang-undangan yang berlaku bagi PPPK, termasuk:</p>
        <ol style="margin-left:20px; margin-top:6px;">
            <li>Gaji pokok sesuai golongan dan masa kerja</li>
            <li>Tunjangan kinerja sesuai ketentuan instansi</li>
            <li>Tunjangan kesehatan (BPJS Kesehatan)</li>
            <li>Jaminan sosial ketenagakerjaan (BPJS Ketenagakerjaan)</li>
        </ol>
    </div>

    <!-- PASAL 4 -->
    <div class="section">
        <p class="pasal">Pasal 4 &ndash; Hak dan Kewajiban</p>
        <p><strong>Hak Pihak Kedua:</strong></p>
        <ol style="margin-left:20px; margin-top:4px;">
            <li>Memperoleh gaji, tunjangan, dan fasilitas sesuai ketentuan</li>
            <li>Memperoleh cuti sesuai ketentuan yang berlaku</li>
            <li>Mendapatkan pengembangan kompetensi</li>
            <li>Mendapatkan perlindungan atas pelaksanaan tugas</li>
        </ol>
        <br>
        <p><strong>Kewajiban Pihak Kedua:</strong></p>
        <ol style="margin-left:20px; margin-top:4px;">
            <li>Setia dan taat kepada Pancasila, UUD 1945, dan pimpinan</li>
            <li>Melaksanakan tugas dengan penuh tanggung jawab dan profesional</li>
            <li>Menjaga rahasia jabatan dan tidak menyalahgunakan wewenang</li>
            <li>Mematuhi kode etik profesi dan peraturan instansi</li>
        </ol>
    </div>

    <!-- PASAL 5 -->
    <div class="section">
        <p class="pasal">Pasal 5 &ndash; Pemutusan Perjanjian Kerja dan Sanksi</p>
        <p>Perjanjian kerja ini dapat diputus sebelum masa berlaku berakhir apabila Pihak Kedua:</p>
        <ol style="margin-left:20px; margin-top:4px;">
            <li>Melakukan pelanggaran disiplin berat sesuai ketentuan yang berlaku</li>
            <li>Tidak memenuhi target kinerja yang telah ditetapkan</li>
            <li>Dihukum penjara berdasarkan putusan pengadilan yang berkekuatan hukum tetap</li>
            <li>Mengundurkan diri atas permintaan sendiri</li>
        </ol>
    </div>

    <!-- PENUTUP -->
    <div class="section">
        <p>Perjanjian kerja ini dibuat dalam 2 (dua) rangkap, masing-masing bermeterai cukup dan mempunyai kekuatan hukum yang sama.</p>
    </div>

    <!-- TTD -->
    <table class="ttd-row">
        <tr>
            <td>
                <p>Pihak Kedua,</p>
                <div class="materai-box">Materai<br>10.000</div>
                <div style="height:40px;"></div>
                <p class="bold">{{ $pegawai->nama }}</p>
                <p>NIP. {{ $pegawai->nip }}</p>
            </td>
            <td>
                <p>Pihak Pertama,</p>
                <div class="cap-box">[CAP RESMI RS]</div>
                <p class="bold">{{ $pengaturan['direktur_rs'] ?? '_______________' }}</p>
                <p>Direktur</p>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh sistem HCMS &mdash; {{ $pengaturan['nama_rs'] ?? '' }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
