<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Surat Keputusan Mutasi</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; }
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
    .section { margin-bottom: 14px; }
    .indent { margin-left: 20px; }
    .memutuskan { display: inline-block; border-top: 1px solid #555; border-bottom: 1px solid #555;
                  padding: 2px 24px; font-weight: bold; }
    .data-table { width: 100%; border-collapse: collapse; margin: 6px 0 6px 16px; }
    .data-table td { padding: 3px 6px; vertical-align: top; }
    .data-table .label { width: 180px; }
    .bordered { border-collapse: collapse; width: 96%; margin: 8px 0 8px 16px; }
    .bordered td { border: 1px solid #444; padding: 4px 8px; vertical-align: top; }
    .ttd { margin-top: 28px; display: flex; justify-content: flex-end; }
    .ttd-block { text-align: center; width: 250px; }
    .ttd-space { height: 65px; }
    .footer { margin-top: 14px; border-top: 1px solid #ccc; padding-top: 6px;
              font-size: 9pt; color: #666; text-align: center; }
    ol.alpha { list-style: none; padding: 0; margin: 6px 0 6px 20px; }
    ol.alpha li { margin-bottom: 4px; }
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
                </td>
            </tr>
        </table>
    </div>

    <!-- JUDUL -->
    <div class="center section">
        <div class="bold">KEPUTUSAN DIREKTUR</div>
        <div class="bold">{{ strtoupper($namaRS) }}</div>
        <div class="bold" style="margin-top:6px;">NOMOR: SKM/{{ $riwayat->nomor_sk ?? '___' }}/{{ now()->year }}</div>
        <div style="margin-top:8px;" class="bold">TENTANG</div>
        <div class="bold">SURAT KEPUTUSAN MUTASI JABATAN</div>
        <div style="margin-top:8px;" class="bold">DIREKTUR {{ strtoupper($namaRS) }},</div>
    </div>

    <!-- MENIMBANG -->
    <div class="section">
        <p class="bold">Menimbang:</p>
        <ol class="alpha">
            <li>a. bahwa dalam rangka pengembangan karir dan optimalisasi pelayanan, dipandang perlu melakukan mutasi jabatan;</li>
            <li>b. bahwa kepentingan dinas menghendaki adanya penyesuaian penempatan pegawai;</li>
            <li>c. bahwa berdasarkan pertimbangan tersebut, perlu menetapkan Keputusan Mutasi Jabatan.</li>
        </ol>
    </div>

    <!-- MENGINGAT -->
    <div class="section">
        <p class="bold">Mengingat:</p>
        <ol class="alpha">
            <li>1. Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara;</li>
            <li>2. Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil.</li>
        </ol>
    </div>

    <!-- MEMUTUSKAN -->
    <div class="center section">
        <span class="memutuskan">MEMUTUSKAN:</span>
    </div>

    <!-- DIKTUM -->
    <div class="section">
        <p><span class="bold">Menetapkan:</span> KEPUTUSAN DIREKTUR TENTANG MUTASI JABATAN PEGAWAI.</p>
    </div>

    <div class="section">
        <p><span class="bold">KESATU:</span> MENGANGKAT:</p>
        <table class="bordered">
            <tr><td style="width:180px;">Nama</td><td>: {{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</td></tr>
            <tr><td>NIP</td><td>: {{ $pegawai->nip }}</td></tr>
            <tr><td>Jabatan Baru</td><td>: {{ $riwayat->nama_jabatan ?? '-' }}</td></tr>
            <tr><td>Unit Kerja</td><td>: {{ $riwayat->unit_kerja ?? '-' }}</td></tr>
            <tr><td>TMT</td><td>: {{ $riwayat->tmt_jabatan ? \Carbon\Carbon::parse($riwayat->tmt_jabatan)->translatedFormat('d F Y') : '-' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <p><span class="bold">KEDUA:</span> Keputusan ini berlaku terhitung mulai tanggal <strong>{{ $riwayat->tmt_jabatan ? \Carbon\Carbon::parse($riwayat->tmt_jabatan)->translatedFormat('d F Y') : '-' }}</strong>.</p>
    </div>

    <div class="section">
        <p><span class="bold">KETIGA:</span> Kepada yang bersangkutan diberikan hak-hak kepegawaian sesuai peraturan perundang-undangan yang berlaku.</p>
    </div>

    <div class="section">
        <p><span class="bold">KEEMPAT:</span> Keputusan ini mulai berlaku sejak tanggal ditetapkan.</p>
    </div>

    @if($riwayat->pejabat_penetap)
    <div class="section">
        <p>Ditetapkan oleh: <strong>{{ $riwayat->pejabat_penetap }}</strong></p>
    </div>
    @endif

    <!-- TTD -->
    <div style="display:flex; justify-content:space-between; margin-top:24px;">
        @if($riwayat->pejabat_penetap)
        <div style="text-align:center; width:220px;">
            <p>Pejabat Penetap,</p>
            <div style="height:65px;"></div>
            <p class="bold" style="text-decoration:underline;">{{ $riwayat->pejabat_penetap }}</p>
        </div>
        @endif
        <div style="text-align:center; width:240px; margin-left:auto;">
            <p>{{ now()->translatedFormat('d F Y') }}</p>
            <p>Direktur {{ $namaRS }},</p>
            <div style="height:65px;"></div>
            <p class="bold" style="text-decoration:underline;">{{ $direktur }}</p>
        </div>
    </div>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh sistem HCMS &mdash; {{ $namaRS }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
