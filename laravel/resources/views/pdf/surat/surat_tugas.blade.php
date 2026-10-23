<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Surat Tugas</title>
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
    .data-table { width: 100%; border-collapse: collapse; margin: 10px 0 10px 20px; }
    .data-table td { padding: 2px 8px; vertical-align: top; }
    .data-table .label { width: 160px; }
    .ttd { margin-top: 30px; text-align: right; }
    .ttd-block { display: inline-block; text-align: center; width: 220px; }
    .cap-box { border: 1px dashed #999; height: 70px; line-height: 70px; color: #999;
               font-size: 9pt; text-align: center; margin: 10px 0; }
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
        <div class="bold" style="font-size:13pt; letter-spacing:2px;">SURAT TUGAS</div>
        <div style="margin-top:4px;">Nomor: {{ $nomorSurat }}</div>
    </div>

    <!-- DASAR -->
    <div class="section isi">
        <p><span class="bold">Dasar:</span> Kebutuhan dinas dan kelancaran pelayanan {{ $pengaturan['nama_rs'] ?? 'Rumah Sakit' }}.</p>
    </div>

    <!-- MENUGASKAN -->
    <div class="section isi">
        <p class="bold">MENUGASKAN:</p>
        <br>
        <p>Kepada:</p>
        <table class="data-table">
            <tr><td class="label">Nama</td><td>: {{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</td></tr>
            <tr><td class="label">NIP</td><td>: {{ $pegawai->nip }}</td></tr>
            <tr><td class="label">Jabatan</td><td>: {{ $pegawai->jabatan }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>: {{ $pegawai->unit_kerja }}</td></tr>
        </table>
        <p><span class="bold">Untuk:</span> Melaksanakan <strong>{{ $tugas }}</strong></p>
        <br>
        <table class="data-table">
            <tr><td class="label">Tempat</td><td>: {{ $tempat }}</td></tr>
            <tr><td class="label">Tanggal</td><td>: {{ \Carbon\Carbon::parse($tanggal_mulai)->translatedFormat('d F Y') }} s/d {{ \Carbon\Carbon::parse($tanggal_selesai)->translatedFormat('d F Y') }}</td></tr>
        </table>
        <p>Setelah menyelesaikan tugas, yang bersangkutan diwajibkan melaporkan hasilnya kepada pimpinan.</p>
    </div>

    <!-- TANDA TANGAN -->
    <div class="ttd">
        <div class="ttd-block">
            <p>{{ $pengaturan['kota_rs'] ?? 'Kota' }}, {{ now()->translatedFormat('d F Y') }}</p>
            <p>Direktur,</p>
            <div class="cap-box">[CAP RESMI RS]</div>
            <p class="bold">{{ $pengaturan['direktur_rs'] ?? '_______________' }}</p>
        </div>
    </div>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh sistem HCMS &mdash; {{ $pengaturan['nama_rs'] ?? '' }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
