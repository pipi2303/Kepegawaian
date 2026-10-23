<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Surat Usulan Kenaikan Pangkat</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; }
    .page { width: 100%; padding: 18mm 25mm; }
    .kop { border-bottom: 4px double #000; padding-bottom: 10px; margin-bottom: 18px; }
    .kop-table { width: 100%; border-collapse: collapse; }
    .logo-box { width: 65px; height: 65px; border: 2px dashed #666; text-align: center;
                font-size: 7pt; color: #666; display: table-cell; vertical-align: middle; }
    .rs-name { font-size: 14pt; font-weight: bold; }
    .rs-info { font-size: 9pt; color: #333; margin-top: 3px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .section { margin-bottom: 14px; }
    .header-title { font-size: 13pt; font-weight: bold; letter-spacing: 1px; text-decoration: underline; margin: 10px 0 4px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .data-table td { padding: 3px 6px; vertical-align: top; }
    .data-table .label { width: 200px; }
    .bordered { border-collapse: collapse; width: 100%; margin: 8px 0; }
    .bordered th, .bordered td { border: 1px solid #333; padding: 5px 8px; text-align: left; font-size: 10pt; }
    .bordered th { background: #f0f0f0; font-weight: bold; text-align: center; }
    .badge { display: inline-block; background: #e8f4ff; border: 1px solid #b0d4f0;
             padding: 2px 10px; border-radius: 4px; font-weight: bold; }
    .arrow { font-size: 16pt; font-weight: bold; color: #333; }
    .ttd-wrap { display: flex; justify-content: space-between; margin-top: 28px; }
    .ttd-block { text-align: center; width: 220px; }
    .ttd-space { height: 65px; }
    .footer { margin-top: 14px; border-top: 1px solid #ccc; padding-top: 6px;
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
                </td>
            </tr>
        </table>
    </div>

    <!-- JUDUL -->
    <div class="center section">
        <div class="header-title">SURAT USULAN KENAIKAN PANGKAT</div>
        <div style="margin-top:4px; font-size:10pt;">Nomor: SUJP/{{ $pegawai->nip }}/{{ now()->year }}</div>
    </div>

    <!-- DATA PEGAWAI -->
    <div class="section">
        <p class="bold" style="margin-bottom:6px;">Data Pegawai yang Diusulkan:</p>
        <table class="data-table">
            <tr><td class="label">Nama</td><td>: {{ trim(($pegawai->gelar_depan ? $pegawai->gelar_depan.' ' : '').$pegawai->nama.($pegawai->gelar_belakang ? ', '.$pegawai->gelar_belakang : '')) }}</td></tr>
            <tr><td class="label">NIP</td><td>: {{ $pegawai->nip }}</td></tr>
            <tr><td class="label">Jabatan</td><td>: {{ $pegawai->jabatan ?? '-' }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>: {{ $pegawai->unit_kerja ?? '-' }}</td></tr>
            <tr><td class="label">Status Pegawai</td><td>: {{ $pegawai->status_pegawai ?? '-' }}</td></tr>
        </table>
    </div>

    <!-- DETAIL KENAIKAN PANGKAT -->
    <div class="section">
        <p class="bold" style="margin-bottom:6px;">Detail Kenaikan Pangkat:</p>
        <table class="bordered">
            <thead>
                <tr>
                    <th>Keterangan</th>
                    <th>Golongan/Pangkat Lama</th>
                    <th></th>
                    <th>Golongan/Pangkat Baru</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Golongan / Pangkat</td>
                    <td style="text-align:center;"><span class="badge">{{ $kp->golongan_lama ?? '-' }} / {{ $kp->pangkat_lama ?? '-' }}</span></td>
                    <td style="text-align:center;" class="arrow">&#8594;</td>
                    <td style="text-align:center;"><span class="badge">{{ $kp->golongan_baru ?? '-' }} / {{ $kp->pangkat_baru ?? '-' }}</span></td>
                </tr>
                <tr>
                    <td>Jenis Kenaikan</td>
                    <td colspan="3"><strong>{{ $kp->jenis_kenaikan ?? '-' }}</strong></td>
                </tr>
                <tr>
                    <td>TMT Berlaku</td>
                    <td colspan="3">{{ $kp->tmt_baru ? \Carbon\Carbon::parse($kp->tmt_baru)->translatedFormat('d F Y') : '-' }}</td>
                </tr>
                @if($kp->nomor_sk)
                <tr>
                    <td>Nomor SK</td>
                    <td colspan="3">{{ $kp->nomor_sk }}</td>
                </tr>
                @endif
            </tbody>
        </table>
    </div>

    <!-- PERTIMBANGAN -->
    <div class="section">
        <p class="bold">Pertimbangan Usulan:</p>
        <ol style="margin: 6px 0 0 20px;">
            <li>Pegawai yang bersangkutan telah memenuhi masa kerja golongan untuk kenaikan pangkat reguler.</li>
            <li>Penilaian kinerja (SKP) dalam 2 (dua) tahun terakhir bernilai baik.</li>
            <li>Tidak sedang menjalani hukuman disiplin tingkat sedang atau berat.</li>
        </ol>
    </div>

    <div class="section">
        <p>Demikian usulan ini kami sampaikan untuk dapat diproses lebih lanjut sesuai ketentuan yang berlaku.</p>
    </div>

    <!-- TTD -->
    <div class="ttd-wrap">
        <div class="ttd-block">
            <p>Kepala Bagian SDM,</p>
            <div class="ttd-space"></div>
            <p class="bold" style="text-decoration:underline;">__________________________</p>
            <p style="font-size:9pt;">NIP. ______________________</p>
        </div>
        <div class="ttd-block">
            <p>{{ now()->translatedFormat('d F Y') }}</p>
            <p>Direktur {{ $namaRS }},</p>
            <div class="ttd-space"></div>
            <p class="bold" style="text-decoration:underline;">__________________________</p>
            <p style="font-size:9pt;">NIP. ______________________</p>
        </div>
    </div>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh sistem HCMS &mdash; {{ $namaRS }} &mdash; {{ now()->translatedFormat('d F Y') }}
    </div>
</div>
</body>
</html>
