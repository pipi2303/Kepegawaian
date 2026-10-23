<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>SK Hukuman Disiplin</title>
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
    .rs-sub  { font-size: 10pt; }
    .rs-info { font-size: 9pt; color: #333; margin-top: 3px; }
    .center  { text-align: center; }
    .bold    { font-weight: bold; }
    .section { margin-bottom: 14px; line-height: 1.8; }
    .indent  { margin-left: 20px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 6px 0 6px 20px; }
    .data-table td { padding: 2px 8px; vertical-align: top; }
    .data-table .label { width: 200px; }
    .diktum  { font-weight: bold; letter-spacing: 1px; text-align: center; margin: 20px 0 10px; font-size: 12pt; }
    .ttd-row { width: 100%; border-collapse: collapse; margin-top: 40px; }
    .ttd-row td { text-align: center; padding: 0 10px; vertical-align: top; }
    .cap-box { border: 1px dashed #999; height: 70px; line-height: 70px; color: #999;
               font-size: 9pt; text-align: center; margin: 10px 0; }
    .footer  { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 6px;
               font-size: 8pt; color: #666; text-align: center; }
    .tingkat-badge { display: inline-block; padding: 2px 10px; border: 1px solid #000; font-weight: bold; }
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
                </td>
            </tr>
        </table>
    </div>

    <!-- JUDUL -->
    <div class="center section">
        <div class="bold" style="font-size:13pt; letter-spacing:2px; text-decoration:underline;">
            SURAT KEPUTUSAN HUKUMAN DISIPLIN
        </div>
        <div style="margin-top:6px;">Nomor: <strong>{{ $disiplin->nomor_sk }}</strong></div>
        <div style="margin-top:2px; font-size:9pt;">Berdasarkan Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil</div>
    </div>

    <!-- MENIMBANG -->
    <div class="section">
        <p class="bold">MENIMBANG:</p>
        <ol class="indent" style="margin-top:6px;">
            <li>Bahwa berdasarkan hasil pemeriksaan, Saudara
                <strong>{{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</strong>
                (NIP. {{ $pegawai->nip }}) terbukti melakukan pelanggaran disiplin;</li>
            <li>Bahwa uraian pelanggaran adalah sebagai berikut:<br>
                <span style="display:block; margin:6px 0 0 10px; font-style:italic;">{{ $disiplin->uraian_pelanggaran }}</span>
            </li>
            <li>Bahwa berdasarkan ketentuan PP 94/2021, pelanggaran tersebut termasuk kategori
                hukuman disiplin <span class="tingkat-badge">{{ strtoupper($disiplin->tingkat_hukuman) }}</span>;</li>
        </ol>
    </div>

    <!-- MENGINGAT -->
    <div class="section">
        <p class="bold">MENGINGAT:</p>
        <ol class="indent" style="margin-top:6px;">
            <li>Undang-Undang Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara;</li>
            <li>Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil;</li>
            <li>Peraturan internal {{ $pengaturan['nama_rs'] ?? 'Rumah Sakit' }} yang berlaku.</li>
        </ol>
    </div>

    <!-- MEMUTUSKAN -->
    <div class="diktum">MEMUTUSKAN</div>

    <div class="section">
        <p class="bold">MENETAPKAN:</p>
        <p style="margin-top:8px;">
            MENJATUHKAN hukuman disiplin
            <strong>{{ strtoupper($disiplin->tingkat_hukuman) }}</strong>
            berupa <strong>{{ $disiplin->jenis_hukuman }}</strong>
            kepada:
        </p>
        <table class="data-table" style="margin-top:8px;">
            <tr><td class="label">Nama</td><td>: <strong>{{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</strong></td></tr>
            <tr><td class="label">NIP</td><td>: {{ $pegawai->nip }}</td></tr>
            <tr><td class="label">Jabatan</td><td>: {{ $pegawai->jabatan ?? '-' }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>: {{ $pegawai->unit_kerja ?? '-' }}</td></tr>
            <tr><td class="label">Berlaku Mulai</td><td>: {{ $disiplin->tanggal_mulai_berlaku?->translatedFormat('d F Y') }}</td></tr>
            @if($disiplin->tanggal_selesai)
            <tr><td class="label">Berlaku Sampai</td><td>: {{ $disiplin->tanggal_selesai->translatedFormat('d F Y') }}</td></tr>
            @endif
        </table>
    </div>

    <div class="section">
        <p>Keputusan ini berlaku sejak tanggal ditetapkan dan apabila terdapat kekeliruan dalam penetapannya akan diadakan perbaikan sebagaimana mestinya.</p>
    </div>

    <!-- TTD -->
    <div style="margin-top:10px;">
        <p>Ditetapkan di: {{ $pengaturan['kota_rs'] ?? '_______________' }}</p>
        <p>Pada tanggal : {{ $disiplin->tanggal_sk?->translatedFormat('d F Y') }}</p>
    </div>

    <table class="ttd-row">
        <tr>
            <td style="width:60%; text-align:left;"></td>
            <td style="width:40%; text-align:center;">
                <p>Direktur,</p>
                <div class="cap-box">[CAP RESMI RS]</div>
                <p class="bold">{{ $pengaturan['direktur_rs'] ?? '_______________' }}</p>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini diterbitkan oleh HCMS &mdash; {{ $pengaturan['nama_rs'] ?? '' }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
