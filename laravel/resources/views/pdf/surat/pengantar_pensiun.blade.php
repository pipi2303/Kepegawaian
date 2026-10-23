<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Surat Pengantar Pensiun</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; }
    .page { width: 100%; padding: 18mm 25mm; }
    .kop { border-bottom: 4px double #000; padding-bottom: 10px; margin-bottom: 18px; }
    .kop-table { width: 100%; border-collapse: collapse; }
    .kop-table td { vertical-align: middle; }
    .logo-box { width: 65px; height: 65px; border: 2px dashed #666; text-align: center;
                font-size: 7pt; color: #666; display: table-cell; vertical-align: middle; }
    .rs-name { font-size: 14pt; font-weight: bold; }
    .rs-info { font-size: 9pt; color: #333; margin-top: 3px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .section { margin-bottom: 12px; }
    .header-title { font-size: 14pt; font-weight: bold; letter-spacing: 1px; text-decoration: underline; margin: 12px 0 4px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .data-table td { padding: 3px 6px; vertical-align: top; }
    .data-table .label { width: 180px; }
    .bordered { border-collapse: collapse; width: 100%; margin: 10px 0; }
    .bordered th, .bordered td { border: 1px solid #333; padding: 5px 8px; text-align: left; font-size: 10pt; }
    .bordered th { background: #f0f0f0; font-weight: bold; }
    .checklist { margin: 10px 0 10px 20px; }
    .checklist li { margin-bottom: 4px; }
    .ttd { margin-top: 28px; display: flex; justify-content: flex-end; }
    .ttd-block { text-align: center; width: 230px; }
    .ttd-space { height: 65px; }
    .footer { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 6px;
              font-size: 8pt; color: #666; text-align: center; }
</style>
</head>
<body>
<div class="page">
    <!-- KOP -->
    <div class="kop">
        <table class="kop-table">
            <tr>
                <td style="width:80px;"><div class="logo-box">LOGO RS</div></td>
                <td style="padding-left:12px;">
                    <div class="rs-name">{{ $namaRS }}</div>
                    <div class="rs-info">{{ $alamatRS }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- NOMOR & JUDUL -->
    <div class="section">
        <table class="data-table">
            <tr><td class="label">Nomor</td><td>: {{ $nomor }}</td></tr>
            <tr><td class="label">Lampiran</td><td>: 1 (satu) berkas</td></tr>
            <tr><td class="label">Perihal</td><td>: Surat Pengantar Pensiun</td></tr>
        </table>
    </div>

    <div class="center section">
        <div class="header-title">SURAT PENGANTAR PENSIUN</div>
    </div>

    <!-- PEMBUKA -->
    <div class="section">
        <p>Yang bertanda tangan di bawah ini:</p>
        <table class="data-table" style="margin:6px 0 6px 20px;">
            <tr><td class="label">Nama</td><td>: {{ $direktur }}</td></tr>
            <tr><td class="label">Jabatan</td><td>: Direktur {{ $namaRS }}</td></tr>
        </table>
        <p>dengan ini menerangkan bahwa pegawai berikut akan memasuki masa purnabakti:</p>
    </div>

    <!-- TABEL DATA PEGAWAI -->
    <table class="bordered">
        <thead>
            <tr>
                <th>NIP</th>
                <th>Nama</th>
                <th>Jabatan</th>
                <th>Unit Kerja</th>
                <th>Gol./Pangkat</th>
                <th>TMT Masuk</th>
                <th>TMT Pensiun</th>
                <th>Masa Kerja</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $pegawai->nip }}</td>
                <td>{{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</td>
                <td>{{ $pegawai->jabatan ?? '-' }}</td>
                <td>{{ $pegawai->unit_kerja ?? '-' }}</td>
                <td>{{ $pegawai->golongan ?? '-' }} / {{ $pegawai->pangkat ?? '-' }}</td>
                <td>{{ $pegawai->tanggal_masuk ? \Carbon\Carbon::parse($pegawai->tanggal_masuk)->translatedFormat('d F Y') : '-' }}</td>
                <td>{{ $pegawai->batas_pensiun ? \Carbon\Carbon::parse($pegawai->batas_pensiun)->translatedFormat('d F Y') : '-' }}</td>
                <td>{{ $masaKerja }} tahun</td>
            </tr>
        </tbody>
    </table>

    <div class="section" style="margin-top:12px;">
        <p>Akan memasuki Masa Purnabakti pada tanggal <strong>{{ $pegawai->batas_pensiun ? \Carbon\Carbon::parse($pegawai->batas_pensiun)->translatedFormat('d F Y') : '-' }}</strong>.</p>
    </div>

    <!-- CHECKLIST DOKUMEN -->
    <div class="section">
        <p class="bold">Dokumen yang perlu disiapkan:</p>
        <ul class="checklist">
            <li>&#9744; Kartu Peserta TASPEN</li>
            <li>&#9744; Fotokopi SK Pengangkatan Pertama dan SK Pangkat Terakhir</li>
            <li>&#9744; Fotokopi SK Pensiun (setelah terbit dari BKN)</li>
            <li>&#9744; Kartu BPJS Kesehatan dan BPJS Ketenagakerjaan</li>
            <li>&#9744; Surat Pernyataan Tidak Sedang Menjalani Hukuman Disiplin</li>
            <li>&#9744; Pas foto terbaru 4×6 sebanyak 6 lembar</li>
            <li>&#9744; Fotokopi KTP dan Kartu Keluarga</li>
            <li>&#9744; Surat Keterangan Sehat dari Dokter Pemerintah</li>
        </ul>
    </div>

    <div class="section">
        <p>Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
    </div>

    <!-- TTD -->
    <div class="ttd">
        <div class="ttd-block">
            <p>{{ now()->translatedFormat('d F Y') }}</p>
            <p>Direktur {{ $namaRS }},</p>
            <div class="ttd-space"></div>
            <p class="bold" style="text-decoration:underline;">{{ $direktur }}</p>
        </div>
    </div>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh sistem HCMS &mdash; {{ $namaRS }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
