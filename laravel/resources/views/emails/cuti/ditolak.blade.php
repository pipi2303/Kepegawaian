@component('mail::message')
# Permohonan Cuti Ditolak

Yth. **{{ $cuti->pegawai->nama_lengkap }}**,

Mohon maaf, permohonan cuti Anda **ditolak** oleh {{ $approver->nama_lengkap }}.

@component('mail::table')
| Detail | |
|:--|:--|
| Jenis Cuti | {{ $cuti->jenis_cuti }} |
| Tanggal | {{ \Carbon\Carbon::parse($cuti->tanggal_mulai)->isoFormat('D MMMM Y') }} – {{ \Carbon\Carbon::parse($cuti->tanggal_selesai)->isoFormat('D MMMM Y') }} |
| Jumlah Hari | {{ $cuti->jumlah_hari }} hari |
| Alasan Penolakan | {{ $alasan }} |
@endcomponent

Jika ada pertanyaan, silakan hubungi Bagian SDM & Kepegawaian secara langsung.

Terima kasih,<br>
**Bagian SDM & Kepegawaian**
@endcomponent
