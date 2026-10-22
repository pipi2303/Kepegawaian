@component('mail::message')
# Permohonan Cuti Disetujui

Yth. **{{ $cuti->pegawai->nama_lengkap }}**,

Permohonan cuti Anda telah **disetujui** oleh {{ $approver->nama_lengkap }}.

@component('mail::table')
| Detail | |
|:--|:--|
| Jenis Cuti | {{ $cuti->jenis_cuti }} |
| Tanggal | {{ \Carbon\Carbon::parse($cuti->tanggal_mulai)->isoFormat('D MMMM Y') }} – {{ \Carbon\Carbon::parse($cuti->tanggal_selesai)->isoFormat('D MMMM Y') }} |
| Jumlah Hari | {{ $cuti->jumlah_hari }} hari |
@endcomponent

Sisa cuti tahunan Anda: **{{ $cuti->pegawai->sisa_cuti_tahunan }} hari**.

Terima kasih,<br>
**Bagian SDM & Kepegawaian**
@endcomponent
