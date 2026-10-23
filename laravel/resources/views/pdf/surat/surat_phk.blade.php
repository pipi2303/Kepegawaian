<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Surat Keputusan PHK</title>
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
    .underline { text-decoration: underline; }
    .section { margin-bottom: 14px; line-height: 1.8; }
    .data-table { width: 100%; border-collapse: collapse; margin: 6px 0 6px 20px; }
    .data-table td { padding: 2px 8px; vertical-align: top; }
    .data-table .label { width: 200px; }
    .kompensasi-table { width: 80%; border-collapse: collapse; margin: 12px auto; }
    .kompensasi-table th { background: #f0f0f0; border: 1px solid #999; padding: 6px 10px; font-size: 10pt; text-align: left; }
    .kompensasi-table td { border: 1px solid #999; padding: 6px 10px; font-size: 10pt; }
    .kompensasi-table .total-row { font-weight: bold; background: #e8f0fe; }
    .kompensasi-table .amount { text-align: right; }
    .diktum  { font-weight: bold; letter-spacing: 1px; text-align: center; margin: 20px 0 10px; font-size: 12pt; }
    .ttd-block { margin-top: 40px; text-align: right; }
    .ttd-block .place-date { margin-bottom: 6px; }
    .ttd-block .name { font-weight: bold; text-decoration: underline; margin-top: 60px; }
    .ttd-block .nip  { font-size: 9pt; }
    .footer  { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 6px;
               font-size: 8pt; color: #666; text-align: center; }
</style>
</head>
<body>
<div class="page">

    <!-- KOP SURAT -->
    <div class="kop">
        <table class="kop-table">
            <tr>
                <td class="logo-cell">
                    <div class="logo-box">LOGO<br>RS</div>
                </td>
                <td class="title-cell">
                    <div class="rs-name">{{ strtoupper($pengaturan['nama_rs'] ?? 'RUMAH SAKIT') }}</div>
                    <div class="rs-sub">{{ $pengaturan['kelas_rs'] ?? '' }}</div>
                    <div class="rs-info">{{ $pengaturan['alamat_rs'] ?? '' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- JUDUL -->
    <div class="section center">
        <div class="diktum">SURAT KEPUTUSAN</div>
        <div class="bold">PEMUTUSAN HUBUNGAN KERJA</div>
        <div style="margin-top:6px;">Nomor: SKPHK/{{ $pegawai->nip ?? '-' }}/{{ now()->year }}</div>
    </div>

    <!-- MENIMBANG / MENGINGAT -->
    <div class="section">
        <p class="bold">Menimbang:</p>
        <p style="margin-left:20px; margin-top:4px;">bahwa berdasarkan evaluasi dan pertimbangan yang matang, perlu dilakukan Pemutusan Hubungan Kerja terhadap pegawai yang bersangkutan;</p>
    </div>

    <div class="section">
        <p class="bold">Mengingat:</p>
        <p style="margin-left:20px; margin-top:4px;">
            1. Undang-Undang No. 13 Tahun 2003 tentang Ketenagakerjaan;<br>
            2. Undang-Undang No. 6 Tahun 2023 tentang Cipta Kerja;<br>
            3. Peraturan Pemerintah Pengganti Undang-Undang No. 2 Tahun 2022;<br>
            4. Peraturan Perusahaan {{ $pengaturan['nama_rs'] ?? 'Rumah Sakit' }} yang berlaku;
        </p>
    </div>

    <!-- MEMUTUSKAN -->
    <div class="diktum">MEMUTUSKAN</div>

    <div class="section">
        <p class="bold">Menetapkan:</p>
        <p style="margin-left:20px; margin-top:4px;">Pemutusan Hubungan Kerja kepada pegawai berikut:</p>
    </div>

    <!-- DATA PEGAWAI -->
    <div class="section">
        <p class="bold">KESATU — Data Pegawai</p>
        <table class="data-table">
            <tr><td class="label">NIP / NIK</td><td>:</td><td>{{ $pegawai->nip ?? '-' }}</td></tr>
            <tr><td class="label">Nama Lengkap</td><td>:</td><td>{{ $pegawai->nama ?? '-' }}</td></tr>
            <tr><td class="label">Jabatan</td><td>:</td><td>{{ $pegawai->jabatan ?? '-' }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>:</td><td>{{ $pegawai->unit_kerja ?? '-' }}</td></tr>
        </table>
    </div>

    <!-- JENIS PHK & ALASAN -->
    <div class="section">
        <p class="bold">KEDUA — Jenis & Alasan PHK</p>
        <table class="data-table">
            <tr><td class="label">Jenis PHK</td><td>:</td><td><strong>{{ $phk->jenis_phk }}</strong></td></tr>
            <tr><td class="label">Alasan</td><td>:</td><td>{{ $phk->alasan }}</td></tr>
            <tr><td class="label">Berlaku Mulai</td><td>:</td><td>{{ \Carbon\Carbon::parse($phk->tanggal_phk)->translatedFormat('d F Y') }}</td></tr>
            @if($phk->nomor_sk)
            <tr><td class="label">Nomor SK</td><td>:</td><td>{{ $phk->nomor_sk }}</td></tr>
            @endif
        </table>
    </div>

    <!-- KOMPENSASI -->
    <div class="section">
        <p class="bold">KETIGA — Kompensasi / Hak Pegawai</p>
        <table class="kompensasi-table">
            <thead>
                <tr>
                    <th>Komponen</th>
                    <th class="amount">Jumlah (Rp)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Uang Pesangon</td>
                    <td class="amount">{{ number_format($phk->pesangon ?? 0, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Uang Penghargaan Masa Kerja</td>
                    <td class="amount">{{ number_format($phk->uang_penghargaan ?? 0, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Uang Pisah</td>
                    <td class="amount">{{ number_format($phk->uang_pisah ?? 0, 0, ',', '.') }}</td>
                </tr>
                <tr class="total-row">
                    <td>TOTAL KOMPENSASI</td>
                    <td class="amount">{{ number_format($phk->total_kompensasi ?? 0, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    @if($phk->catatan)
    <div class="section">
        <p class="bold">KEEMPAT — Catatan</p>
        <p style="margin-left:20px; margin-top:4px;">{{ $phk->catatan }}</p>
    </div>
    @endif

    <!-- TTD -->
    <div class="ttd-block">
        <div class="place-date">Ditetapkan di: {{ $pengaturan['alamat_rs'] ?? 'Bandar Lampung' }}</div>
        <div>Pada tanggal: {{ now()->translatedFormat('d F Y') }}</div>
        <br>
        <div class="bold">{{ strtoupper($pengaturan['nama_rs'] ?? 'Rumah Sakit') }}</div>
        <div>Direktur,</div>
        <div style="height:60px;"></div>
        <div class="name">{{ $pengaturan['direktur_rs'] ?? 'Direktur' }}</div>
        @if(!empty($pengaturan['nip_direktur']))
        <div class="nip">NIP. {{ $pengaturan['nip_direktur'] }}</div>
        @endif
    </div>

    <div class="footer">
        Dokumen ini diterbitkan secara resmi oleh {{ $pengaturan['nama_rs'] ?? 'Rumah Sakit' }} · HCMS Application
    </div>
</div>
</body>
</html>
