@component('mail::message')
# Peringatan: STR/SIP Akan Kadaluarsa

Yth. **{{ $pegawai->nama_lengkap }}**,

Kami menginformasikan bahwa STR/SIP Anda akan **kadaluarsa dalam {{ $hariTersisa }} hari**.

Segera lakukan perpanjangan melalui **Komite Medik** agar kelancaran praktik Anda tidak terganggu.

@component('mail::panel')
Batas waktu perpanjangan sangat disarankan **minimal 30 hari sebelum tanggal kadaluarsa** untuk menghindari proses administrasi yang terhambat.
@endcomponent

Untuk informasi lebih lanjut, hubungi Komite Medik atau Bagian SDM & Kepegawaian.

Terima kasih,<br>
**Bagian SDM & Kepegawaian**
@endcomponent
