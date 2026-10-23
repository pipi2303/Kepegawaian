<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Surat Izin Cuti</title>
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
    .section { margin-bottom: 14px; }
    .isi { line-height: 2; }
    .tbl { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .tbl td, .tbl th { border: 1px solid #000; padding: 5px 8px; }
    .tbl th { background-color: #e0e0e0; font-weight: bold; }
    .ttd-row { width: 100%; border-collapse: collapse; margin-top: 30px; }
    .ttd-row td { text-align: center; padding: 0 10px; vertical-align: top; width: 50%; }
    .cap-box { border: 1px dashed #999; height: 70px; line-height: 70px; color: #999;
               font-size: 9pt; text-align: center; margin: 10px 0; }
    .tembusan { margin-top: 20px; font-size: 10pt; }
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
        <div class="bold" style="font-size:13pt; letter-spacing:2px;">SURAT IZIN CUTI</div>
        <div style="margin-top:4px;">Nomor: {{ $nomorSurat }}</div>
    </div>

    <!-- ISI -->
    <div class="section isi">
        <p>Diberikan izin cuti kepada pegawai berikut:</p>
    </div>

    <table class="tbl">
        <tr><th>Keterangan</th><th>Data</th></tr>
        <tr><td>Nama</td><td>{{ trim(($cuti->pegawai->gelar_depan ? $cuti->pegawai->gelar_depan.' ' : '').$cuti->pegawai->nama.($cuti->pegawai->gelar_belakang ? ', '.$cuti->pegawai->gelar_belakang : '')) }}</td></tr>
        <tr><td>NIP</td><td>{{ $cuti->pegawai->nip }}</td></tr>
        <tr><td>Jabatan</td><td>{{ $cuti->pegawai->jabatan }}</td></tr>
        <tr><td>Unit Kerja</td><td>{{ $cuti->pegawai->unit_kerja }}</td></tr>
        <tr><td>Jenis Cuti</td><td>{{ $cuti->jenis_cuti }}</td></tr>
        <tr><td>Tanggal Mulai</td><td>{{ \Carbon\Carbon::parse($cuti->tanggal_mulai)->translatedFormat('d F Y') }}</td></tr>
        <tr><td>Tanggal Selesai</td><td>{{ \Carbon\Carbon::parse($cuti->tanggal_selesai)->translatedFormat('d F Y') }}</td></tr>
        <tr><td>Jumlah Hari</td><td>{{ $cuti->jumlah_hari }} hari kerja</td></tr>
        <tr><td>Alasan</td><td>{{ $cuti->alasan }}</td></tr>
    </table>

    <div class="section isi" style="margin-top:14px;">
        <p>Selama menjalankan cuti, segala tanggung jawab pekerjaan diserahkan kepada atasan langsung atau pengganti yang ditunjuk.</p>
    </div>

    <!-- TTD -->
    <table class="ttd-row">
        <tr>
            <td>
                <p>{{ $pengaturan['kota_rs'] ?? 'Kota' }}, {{ now()->translatedFormat('d F Y') }}</p>
                <p>Kepala Bagian SDM,</p>
                <div class="cap-box">[TTD]</div>
                <p class="bold">________________________</p>
            </td>
            <td>
                <p>{{ $pengaturan['kota_rs'] ?? 'Kota' }}, {{ now()->translatedFormat('d F Y') }}</p>
                <p>Direktur,</p>
                <div class="cap-box">[CAP RESMI RS]</div>
                <p class="bold">{{ $pengaturan['direktur_rs'] ?? '_______________' }}</p>
            </td>
        </tr>
    </table>

    <!-- TEMBUSAN -->
    <div class="tembusan">
        <p class="bold">Tembusan:</p>
        <ol style="margin-left:20px;">
            <li>Kepala Unit Kerja yang bersangkutan</li>
            <li>Bagian Kepegawaian (arsip)</li>
            <li>Yang bersangkutan</li>
        </ol>
    </div>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh sistem HCMS &mdash; {{ $pengaturan['nama_rs'] ?? '' }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
