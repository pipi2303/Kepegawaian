<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Slip Gaji - {{ $gaji->pegawai->nip }}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #222; }
    .page { width: 100%; padding: 20px 28px; }

    /* Header */
    .header { display: block; border-bottom: 3px solid #1a4a8a; padding-bottom: 10px; margin-bottom: 14px; }
    .header-inner { width: 100%; }
    .header-inner td { vertical-align: middle; }
    .logo-cell { width: 70px; }
    .logo-box { width: 60px; height: 60px; border: 2px dashed #999; text-align: center; font-size: 7pt; color: #999; line-height: 60px; }
    .title-cell { padding-left: 12px; }
    .rs-name { font-size: 14pt; font-weight: bold; color: #1a4a8a; }
    .doc-title { font-size: 12pt; font-weight: bold; color: #333; margin-top: 2px; letter-spacing: 2px; }
    .periode { font-size: 9pt; color: #555; margin-top: 2px; }

    /* Sections */
    .section-title {
        background-color: #1a4a8a; color: #fff; font-weight: bold;
        font-size: 9pt; padding: 4px 8px; margin-bottom: 6px; margin-top: 12px;
    }

    /* Pegawai table */
    .tbl-pegawai { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .tbl-pegawai td { padding: 3px 6px; }
    .tbl-pegawai td:first-child { width: 160px; font-weight: bold; color: #444; }
    .tbl-pegawai td:nth-child(2) { width: 10px; }

    /* Komponen gaji */
    .tbl-komponen { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .tbl-komponen th {
        background-color: #dde8f5; color: #1a4a8a; font-weight: bold;
        padding: 5px 8px; border: 1px solid #b0c4de; text-align: left;
    }
    .tbl-komponen td { padding: 3px 8px; border: 1px solid #ddd; vertical-align: top; }
    .tbl-komponen tr:nth-child(even) td { background-color: #f7f9fc; }
    .tbl-komponen .total-row td {
        font-weight: bold; background-color: #dde8f5; border-top: 2px solid #1a4a8a;
    }
    .amount { text-align: right; }
    .col-label { width: 48%; }
    .col-amount { width: 22%; }
    .col-sep { width: 4%; }

    /* Netto box */
    .netto-box {
        margin-top: 14px; padding: 10px 16px;
        border: 2px solid #1a4a8a; background-color: #eaf0fb;
    }
    .netto-label { font-size: 10pt; font-weight: bold; color: #1a4a8a; }
    .netto-amount { font-size: 14pt; font-weight: bold; color: #1a4a8a; text-align: right; }

    /* Footer */
    .footer { margin-top: 20px; font-size: 8pt; color: #777; border-top: 1px solid #ccc; padding-top: 8px; }
    .signature-area { margin-top: 16px; }
    .signature-box { display: inline-block; width: 200px; text-align: center; font-size: 9pt; }
    .signature-line { border-bottom: 1px solid #444; margin: 45px 0 4px 0; }
</style>
</head>
<body>
<div class="page">

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <table class="header-inner">
            <tr>
                <td class="logo-cell">
                    <div class="logo-box">LOGO</div>
                </td>
                <td class="title-cell">
                    <div class="rs-name">{{ $namaRs }}</div>
                    <div class="doc-title">SLIP GAJI</div>
                    <div class="periode">Periode: {{ $bulanNama }} {{ $gaji->tahun }}</div>
                </td>
                <td style="text-align:right; font-size:8pt; color:#888; vertical-align:bottom;">
                    No. Dokumen: SG/{{ $gaji->tahun }}/{{ str_pad($gaji->bulan, 2, '0', STR_PAD_LEFT) }}/{{ $gaji->pegawai->nip }}<br>
                    Status: <strong>{{ $gaji->status_pembayaran }}</strong>
                </td>
            </tr>
        </table>
    </div>

    {{-- ===== DATA PEGAWAI ===== --}}
    <div class="section-title">DATA PEGAWAI</div>
    <table class="tbl-pegawai">
        <tr>
            <td>NIP</td><td>:</td>
            <td>{{ $gaji->pegawai->nip }}</td>
            <td width="40%"></td>
        </tr>
        <tr>
            <td>Nama Lengkap</td><td>:</td>
            <td><strong>{{ $gaji->pegawai->nama_lengkap }}</strong></td>
        </tr>
        <tr>
            <td>Jabatan</td><td>:</td>
            <td>{{ $gaji->pegawai->jabatan ?? '-' }}</td>
        </tr>
        <tr>
            <td>Unit Kerja</td><td>:</td>
            <td>{{ $gaji->pegawai->unit_kerja ?? '-' }}</td>
        </tr>
        <tr>
            <td>Golongan / Pangkat</td><td>:</td>
            <td>{{ $gaji->pegawai->golongan ?? '-' }} / {{ $gaji->pegawai->pangkat ?? '-' }}</td>
        </tr>
        <tr>
            <td>Status Pegawai</td><td>:</td>
            <td>{{ $gaji->pegawai->status_pegawai ?? '-' }}</td>
        </tr>
    </table>

    {{-- ===== KOMPONEN GAJI ===== --}}
    <div class="section-title">RINCIAN GAJI</div>

    @php
        $penerimaan = $details['penerimaan'];
        $potongan   = $details['potongan'];
        $maxRows    = max($penerimaan->count(), $potongan->count());
        $totalPenerimaan = $penerimaan->sum('jumlah');
        $totalPotongan   = $potongan->sum('jumlah');
    @endphp

    <table class="tbl-komponen">
        <thead>
            <tr>
                <th class="col-label">PENERIMAAN</th>
                <th class="col-amount amount">Jumlah (Rp)</th>
                <th class="col-sep"></th>
                <th class="col-label">POTONGAN</th>
                <th class="col-amount amount">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @for ($i = 0; $i < $maxRows; $i++)
                @php
                    $p = $penerimaan->get($i);
                    $q = $potongan->get($i);
                @endphp
                <tr>
                    <td>{{ $p ? $p->nama_komponen : '' }}</td>
                    <td class="amount">{{ $p ? 'Rp ' . number_format($p->jumlah, 0, ',', '.') : '' }}</td>
                    <td style="border-left: 2px solid #b0c4de;"></td>
                    <td>{{ $q ? $q->nama_komponen : '' }}</td>
                    <td class="amount">{{ $q ? 'Rp ' . number_format($q->jumlah, 0, ',', '.') : '' }}</td>
                </tr>
            @endfor
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td>Total Penerimaan</td>
                <td class="amount">Rp {{ number_format($totalPenerimaan, 0, ',', '.') }}</td>
                <td style="border-left: 2px solid #b0c4de;"></td>
                <td>Total Potongan</td>
                <td class="amount">Rp {{ number_format($totalPotongan, 0, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>

    {{-- ===== GAJI NETTO ===== --}}
    <table class="tbl-komponen" style="margin-top:0; border-top:none;">
        <tr>
            <td class="netto-label" style="border:2px solid #1a4a8a; background:#eaf0fb; padding:8px 16px; width:78%;">
                GAJI NETTO (TAKE HOME PAY)
            </td>
            <td class="netto-amount" style="border:2px solid #1a4a8a; border-left:none; background:#eaf0fb; padding:8px 16px; text-align:right; font-size:13pt; font-weight:bold; color:#1a4a8a;">
                Rp {{ number_format($gaji->total_netto, 0, ',', '.') }}
            </td>
        </tr>
    </table>

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <table style="width:100%;">
            <tr>
                <td style="vertical-align:bottom; font-size:8pt; color:#777;">
                    Dicetak pada {{ now()->isoFormat('D MMMM Y') }}<br>
                    <em>Slip gaji ini dicetak secara elektronik dan sah tanpa tanda tangan basah.</em>
                </td>
                <td style="text-align:center; width:220px;">
                    <div style="font-size:9pt;">Mengetahui,</div>
                    <div style="font-size:9pt; font-weight:bold;">Kepala Bagian Keuangan</div>
                    <div style="margin: 40px 0 4px 0; border-bottom: 1px solid #444;"></div>
                    <div style="font-size:9pt;">( _________________________ )</div>
                    <div style="font-size:8pt; color:#666;">NIP.</div>
                </td>
            </tr>
        </table>
    </div>

</div>
</body>
</html>
