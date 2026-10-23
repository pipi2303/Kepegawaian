<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('m_pegawai')->count() > 10) {
            $this->command->warn('Demo data: database already has data. Skipping.');
            return;
        }

        $this->command->info('Seeding demo data for RSUD presentation...');

        $this->seedTPPKelas();
        $this->seedRBKIndeks();
        $this->seedPegawai();
        $this->seedCuti();
        $this->seedAbsensi();
        $this->seedSKP();
        $this->seedPenghargaan();
        $this->seedKomite();

        $this->command->info('Demo data seeded successfully!');
    }

    // -------------------------------------------------------------------------
    // TPP Kelas
    // -------------------------------------------------------------------------
    private function seedTPPKelas(): void
    {
        $kelas = [
            ['nama_kelas' => 'Direktur',         'eselon' => 'II',  'nilai_dasar' => 8_000_000, 'keterangan' => 'Direktur RSUD'],
            ['nama_kelas' => 'Kepala Bidang',    'eselon' => 'III', 'nilai_dasar' => 6_000_000, 'keterangan' => 'Kepala Bidang / Kabag'],
            ['nama_kelas' => 'Kepala Seksi',     'eselon' => 'IV',  'nilai_dasar' => 4_500_000, 'keterangan' => 'Kepala Seksi / Kasubag'],
            ['nama_kelas' => 'Staf Fungsional',  'eselon' => null,  'nilai_dasar' => 3_500_000, 'keterangan' => 'Tenaga Fungsional (Dokter, Perawat, dll.)'],
            ['nama_kelas' => 'Staf Pelaksana',   'eselon' => null,  'nilai_dasar' => 2_500_000, 'keterangan' => 'Staf Pelaksana / Non-Fungsional'],
        ];

        foreach ($kelas as $k) {
            DB::table('t_tpp_kelas')->insertOrIgnore([
                'nama_kelas'  => $k['nama_kelas'],
                'eselon'      => $k['eselon'],
                'nilai_dasar' => $k['nilai_dasar'],
                'keterangan'  => $k['keterangan'],
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // RBK Indeks
    // -------------------------------------------------------------------------
    private function seedRBKIndeks(): void
    {
        $rows = [
            ['nama_jabatan' => 'Direktur',         'eselon' => 'II',  'indeks' => 3.50, 'nilai_dasar_rbk' => 8_000_000],
            ['nama_jabatan' => 'Kepala Bidang',    'eselon' => 'III', 'indeks' => 2.50, 'nilai_dasar_rbk' => 6_000_000],
            ['nama_jabatan' => 'Kepala Seksi',     'eselon' => 'IV',  'indeks' => 2.00, 'nilai_dasar_rbk' => 4_500_000],
            ['nama_jabatan' => 'Staf Fungsional',  'eselon' => null,  'indeks' => 1.50, 'nilai_dasar_rbk' => 3_500_000],
            ['nama_jabatan' => 'Staf Pelaksana',   'eselon' => null,  'indeks' => 1.00, 'nilai_dasar_rbk' => 2_500_000],
        ];

        foreach ($rows as $r) {
            DB::table('t_rbk_indeks')->insertOrIgnore([
                'nama_jabatan'   => $r['nama_jabatan'],
                'eselon'         => $r['eselon'],
                'indeks'         => $r['indeks'],
                'nilai_dasar_rbk' => $r['nilai_dasar_rbk'],
                'keterangan'     => null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Pegawai — 25 orang
    // -------------------------------------------------------------------------
    private function seedPegawai(): void
    {
        $now = now();
        $pegawai = $this->pegawaiData();

        foreach ($pegawai as $p) {
            DB::table('m_pegawai')->insert(array_merge($p, [
                'password'   => Hash::make('password123'),
                'status_aktif' => 'Aktif',
                'foto'       => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }

    private function pegawaiData(): array
    {
        // NIP helper: 18-digit PNS format YYYYMMDD + jk(1) + YYYYMM + seq(3)
        // e.g. 197103151 200103 001  → "197103151200103001"
        $nip = function (string $tglLahir, string $jk, string $tglMasuk, int $seq): string {
            $tl      = Carbon::parse($tglLahir);
            $tm      = Carbon::parse($tglMasuk);
            $jkDigit = ($jk === 'L') ? '1' : '2';
            return sprintf(
                '%s%s%s%s%03d',
                $tl->format('Ymd'),
                $jkDigit,
                $tm->format('Ym'),
                $seq
            );
        };

        return [
            // 0 — Direktur
            [
                'nip'               => $nip('1971-03-15', 'L', '2001-03-01', 1),
                'nama'              => 'Bambang Supriyanto',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => 'M.Kes., MARS',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Yogyakarta',
                'tanggal_lahir'     => '1971-03-15',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Diponegoro No. 12, Yogyakarta',
                'no_telp'           => '08121234001',
                'email'             => 'bambang.supriyanto@rsudam.id',
                'jabatan'           => 'Direktur RSUD',
                'jabatan_fungsional'=> 'Dokter Spesialis',
                'unit_kerja'        => 'Direksi',
                'golongan'          => 'IV/c',
                'pangkat'           => 'Pembina Utama Muda',
                'tmt_golongan'      => '2020-10-01',
                'tmt_jabatan'       => '2019-05-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S2',
                'jurusan'           => 'Administrasi Rumah Sakit',
                'institusi'         => 'Universitas Gadjah Mada',
                'tahun_lulus'       => 2000,
                'tanggal_masuk'     => '2001-03-01',
                'batas_pensiun'     => '2029-03-15', // 58 th (Dokter)
                'masa_kerja'        => '25 Tahun 7 Bulan',
                'eselon'            => 'II',
                'tmt_gaji_berkala'  => '2022-10-01',
                'kgb_berikutnya'    => '2024-10-01',
                'masa_kerja_golongan'=> 48,
                'badge'             => 'DIR-001',
            ],

            // 1 — Dokter Spesialis Bedah
            [
                'nip'               => $nip('1975-07-22', 'L', '2004-04-01', 2),
                'nama'              => 'Rudi Hartono',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => 'Sp.B',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Surabaya',
                'tanggal_lahir'     => '1975-07-22',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Veteran No. 45, Surabaya',
                'no_telp'           => '08121234002',
                'email'             => 'rudi.hartono@rsudam.id',
                'jabatan'           => 'Dokter Spesialis Bedah',
                'jabatan_fungsional'=> 'Dokter Spesialis Pertama',
                'unit_kerja'        => 'Instalasi Bedah Sentral',
                'golongan'          => 'IV/b',
                'pangkat'           => 'Pembina Tingkat I',
                'tmt_golongan'      => '2021-04-01',
                'tmt_jabatan'       => '2004-04-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S2',
                'jurusan'           => 'Ilmu Bedah',
                'institusi'         => 'Universitas Airlangga',
                'tahun_lulus'       => 2003,
                'tanggal_masuk'     => '2004-04-01',
                'batas_pensiun'     => '2033-07-22',
                'masa_kerja'        => '22 Tahun 6 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-04-01',
                'kgb_berikutnya'    => Carbon::now()->addDays(45)->toDateString(), // demo: KGB dalam 45 hari
                'masa_kerja_golongan'=> 42,
                'badge'             => 'DSP-001',
            ],

            // 2 — Dokter Spesialis Penyakit Dalam
            [
                'nip'               => $nip('1978-11-10', 'P', '2006-01-01', 3),
                'nama'              => 'Sri Wahyuni',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => 'Sp.PD',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Semarang',
                'tanggal_lahir'     => '1978-11-10',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Pemuda No. 78, Semarang',
                'no_telp'           => '08121234003',
                'email'             => 'sri.wahyuni@rsudam.id',
                'jabatan'           => 'Dokter Spesialis Penyakit Dalam',
                'jabatan_fungsional'=> 'Dokter Spesialis Muda',
                'unit_kerja'        => 'Instalasi Rawat Inap Interna',
                'golongan'          => 'IV/a',
                'pangkat'           => 'Pembina',
                'tmt_golongan'      => '2019-01-01',
                'tmt_jabatan'       => '2006-01-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S2',
                'jurusan'           => 'Ilmu Penyakit Dalam',
                'institusi'         => 'Universitas Diponegoro',
                'tahun_lulus'       => 2005,
                'tanggal_masuk'     => '2006-01-01',
                'batas_pensiun'     => '2036-11-10',
                'masa_kerja'        => '20 Tahun 9 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2021-01-01',
                'kgb_berikutnya'    => '2025-01-01',
                'masa_kerja_golongan'=> 24,
                'badge'             => 'DSP-002',
            ],

            // 3 — Dokter Spesialis Anak
            [
                'nip'               => $nip('1980-05-18', 'P', '2008-03-01', 4),
                'nama'              => 'Dewi Kurniawati',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => 'Sp.A',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Bandung',
                'tanggal_lahir'     => '1980-05-18',
                'agama'             => 'Kristen',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Dago No. 10, Bandung',
                'no_telp'           => '08121234004',
                'email'             => 'dewi.kurniawati@rsudam.id',
                'jabatan'           => 'Dokter Spesialis Anak',
                'jabatan_fungsional'=> 'Dokter Spesialis Pertama',
                'unit_kerja'        => 'Instalasi Rawat Inap Anak',
                'golongan'          => 'III/d',
                'pangkat'           => 'Penata Tingkat I',
                'tmt_golongan'      => '2020-03-01',
                'tmt_jabatan'       => '2008-03-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S2',
                'jurusan'           => 'Ilmu Kesehatan Anak',
                'institusi'         => 'Universitas Padjadjaran',
                'tahun_lulus'       => 2007,
                'tanggal_masuk'     => '2008-03-01',
                'batas_pensiun'     => '2038-05-18',
                'masa_kerja'        => '18 Tahun 7 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2022-03-01',
                'kgb_berikutnya'    => '2026-03-01',
                'masa_kerja_golongan'=> 30,
                'badge'             => 'DSP-003',
            ],

            // 4 — Dokter Spesialis Kandungan
            [
                'nip'               => $nip('1977-09-03', 'L', '2005-07-01', 5),
                'nama'              => 'Agus Priyambodo',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => 'Sp.OG',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Malang',
                'tanggal_lahir'     => '1977-09-03',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Ijen No. 33, Malang',
                'no_telp'           => '08121234005',
                'email'             => 'agus.priyambodo@rsudam.id',
                'jabatan'           => 'Dokter Spesialis Obstetri & Ginekologi',
                'jabatan_fungsional'=> 'Dokter Spesialis Madya',
                'unit_kerja'        => 'Instalasi Kebidanan (VK)',
                'golongan'          => 'IV/a',
                'pangkat'           => 'Pembina',
                'tmt_golongan'      => '2018-07-01',
                'tmt_jabatan'       => '2005-07-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S2',
                'jurusan'           => 'Obstetri & Ginekologi',
                'institusi'         => 'Universitas Brawijaya',
                'tahun_lulus'       => 2004,
                'tanggal_masuk'     => '2005-07-01',
                'batas_pensiun'     => '2035-09-03',
                'masa_kerja'        => '21 Tahun 3 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2020-07-01',
                'kgb_berikutnya'    => '2024-07-01',
                'masa_kerja_golongan'=> 36,
                'badge'             => 'DSP-004',
            ],

            // 5 — Dokter Umum 1
            [
                'nip'               => $nip('1988-02-14', 'L', '2014-01-01', 6),
                'nama'              => 'Ferdy Setiawan',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => null,
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Jakarta',
                'tanggal_lahir'     => '1988-02-14',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Kebon Sirih No. 5, Jakarta',
                'no_telp'           => '08121234006',
                'email'             => 'ferdy.setiawan@rsudam.id',
                'jabatan'           => 'Dokter Umum',
                'jabatan_fungsional'=> 'Dokter Pertama',
                'unit_kerja'        => 'Instalasi Gawat Darurat (IGD)',
                'golongan'          => 'III/c',
                'pangkat'           => 'Penata',
                'tmt_golongan'      => '2022-01-01',
                'tmt_jabatan'       => '2014-01-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Kedokteran Umum',
                'institusi'         => 'Universitas Indonesia',
                'tahun_lulus'       => 2013,
                'tanggal_masuk'     => '2014-01-01',
                'batas_pensiun'     => '2046-02-14',
                'masa_kerja'        => '12 Tahun 9 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2024-01-01',
                'kgb_berikutnya'    => '2026-01-01',
                'masa_kerja_golongan'=> 12,
                'badge'             => 'DU-001',
            ],

            // 6 — Dokter Umum 2
            [
                'nip'               => $nip('1990-06-25', 'P', '2016-04-01', 7),
                'nama'              => 'Nadia Puspitasari',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => null,
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Surakarta',
                'tanggal_lahir'     => '1990-06-25',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Slamet Riyadi No. 88, Surakarta',
                'no_telp'           => '08121234007',
                'email'             => 'nadia.puspitasari@rsudam.id',
                'jabatan'           => 'Dokter Umum',
                'jabatan_fungsional'=> 'Dokter Pertama',
                'unit_kerja'        => 'Poli Umum',
                'golongan'          => 'III/b',
                'pangkat'           => 'Penata Muda Tingkat I',
                'tmt_golongan'      => '2022-04-01',
                'tmt_jabatan'       => '2016-04-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Kedokteran Umum',
                'institusi'         => 'Universitas Sebelas Maret',
                'tahun_lulus'       => 2015,
                'tanggal_masuk'     => '2016-04-01',
                'batas_pensiun'     => '2046-06-25',
                'masa_kerja'        => '10 Tahun 6 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2024-04-01',
                'kgb_berikutnya'    => '2026-04-01',
                'masa_kerja_golongan'=> 24,
                'badge'             => 'DU-002',
            ],

            // 7 — Dokter Umum 3
            [
                'nip'               => $nip('1992-12-01', 'L', '2018-08-01', 8),
                'nama'              => 'Bayu Anggoro',
                'gelar_depan'       => 'dr.',
                'gelar_belakang'    => null,
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Pekalongan',
                'tanggal_lahir'     => '1992-12-01',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Belum Menikah',
                'alamat'            => 'Jl. Batik No. 7, Pekalongan',
                'no_telp'           => '08121234008',
                'email'             => 'bayu.anggoro@rsudam.id',
                'jabatan'           => 'Dokter Umum',
                'jabatan_fungsional'=> 'Dokter Pertama',
                'unit_kerja'        => 'Instalasi Gawat Darurat (IGD)',
                'golongan'          => 'III/a',
                'pangkat'           => 'Penata Muda',
                'tmt_golongan'      => '2018-08-01',
                'tmt_jabatan'       => '2018-08-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Kedokteran Umum',
                'institusi'         => 'Universitas Jenderal Soedirman',
                'tahun_lulus'       => 2017,
                'tanggal_masuk'     => '2018-08-01',
                'batas_pensiun'     => '2050-12-01',
                'masa_kerja'        => '8 Tahun 2 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2022-08-01',
                'kgb_berikutnya'    => '2026-08-01',
                'masa_kerja_golongan'=> 8,
                'badge'             => 'DU-003',
            ],

            // 8 — Perawat IGD 1
            [
                'nip'               => $nip('1985-04-20', 'L', '2010-03-01', 9),
                'nama'              => 'Hendra Gunawan',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kep., Ns',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Purwokerto',
                'tanggal_lahir'     => '1985-04-20',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Gerilya No. 22, Purwokerto',
                'no_telp'           => '08121234009',
                'email'             => 'hendra.gunawan@rsudam.id',
                'jabatan'           => 'Perawat Ahli Muda',
                'jabatan_fungsional'=> 'Perawat Ahli Muda',
                'unit_kerja'        => 'Instalasi Gawat Darurat (IGD)',
                'golongan'          => 'III/c',
                'pangkat'           => 'Penata',
                'tmt_golongan'      => '2020-03-01',
                'tmt_jabatan'       => '2010-03-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Ilmu Keperawatan',
                'institusi'         => 'Universitas Jenderal Soedirman',
                'tahun_lulus'       => 2009,
                'tanggal_masuk'     => '2010-03-01',
                'batas_pensiun'     => '2041-04-20',
                'masa_kerja'        => '16 Tahun 7 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2022-03-01',
                'kgb_berikutnya'    => '2026-03-01',
                'masa_kerja_golongan'=> 18,
                'badge'             => 'PRW-001',
            ],

            // 9 — Perawat IGD 2
            [
                'nip'               => $nip('1990-08-11', 'P', '2015-02-01', 10),
                'nama'              => 'Rina Marlina',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kep., Ns',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Tasikmalaya',
                'tanggal_lahir'     => '1990-08-11',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. HZ. Mustofa No. 14, Tasikmalaya',
                'no_telp'           => '08121234010',
                'email'             => 'rina.marlina@rsudam.id',
                'jabatan'           => 'Perawat Ahli Pertama',
                'jabatan_fungsional'=> 'Perawat Ahli Pertama',
                'unit_kerja'        => 'Instalasi Gawat Darurat (IGD)',
                'golongan'          => 'III/b',
                'pangkat'           => 'Penata Muda Tingkat I',
                'tmt_golongan'      => '2021-02-01',
                'tmt_jabatan'       => '2015-02-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Ilmu Keperawatan',
                'institusi'         => 'Universitas Siliwangi',
                'tahun_lulus'       => 2014,
                'tanggal_masuk'     => '2015-02-01',
                'batas_pensiun'     => '2046-08-11',
                'masa_kerja'        => '11 Tahun 8 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-02-01',
                'kgb_berikutnya'    => '2025-02-01',
                'masa_kerja_golongan'=> 12,
                'badge'             => 'PRW-002',
            ],

            // 10 — Perawat ICU 1
            [
                'nip'               => $nip('1983-01-07', 'L', '2008-06-01', 11),
                'nama'              => 'Dodi Firmansyah',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kep., Ns',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Ciamis',
                'tanggal_lahir'     => '1983-01-07',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Jenderal Sudirman No. 4, Ciamis',
                'no_telp'           => '08121234011',
                'email'             => 'dodi.firmansyah@rsudam.id',
                'jabatan'           => 'Perawat Ahli Muda',
                'jabatan_fungsional'=> 'Perawat Ahli Muda',
                'unit_kerja'        => 'Instalasi Perawatan Intensif (ICU)',
                'golongan'          => 'III/c',
                'pangkat'           => 'Penata',
                'tmt_golongan'      => '2019-06-01',
                'tmt_jabatan'       => '2008-06-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Ilmu Keperawatan',
                'institusi'         => 'Universitas Padjadjaran',
                'tahun_lulus'       => 2007,
                'tanggal_masuk'     => '2008-06-01',
                'batas_pensiun'     => Carbon::now()->addDays(75)->toDateString(), // demo: pensiun dalam 75 hari
                'masa_kerja'        => '18 Tahun 4 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2021-06-01',
                'kgb_berikutnya'    => '2025-06-01',
                'masa_kerja_golongan'=> 30,
                'badge'             => 'PRW-003',
            ],

            // 11 — Perawat ICU 2
            [
                'nip'               => $nip('1991-10-29', 'P', '2016-08-01', 12),
                'nama'              => 'Yanti Kusumawati',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kep., Ns',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Magelang',
                'tanggal_lahir'     => '1991-10-29',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Tentara Pelajar No. 9, Magelang',
                'no_telp'           => '08121234012',
                'email'             => 'yanti.kusumawati@rsudam.id',
                'jabatan'           => 'Perawat Ahli Pertama',
                'jabatan_fungsional'=> 'Perawat Ahli Pertama',
                'unit_kerja'        => 'Instalasi Perawatan Intensif (ICU)',
                'golongan'          => 'III/b',
                'pangkat'           => 'Penata Muda Tingkat I',
                'tmt_golongan'      => '2022-08-01',
                'tmt_jabatan'       => '2016-08-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Ilmu Keperawatan',
                'institusi'         => 'Universitas Muhammadiyah Magelang',
                'tahun_lulus'       => 2015,
                'tanggal_masuk'     => '2016-08-01',
                'batas_pensiun'     => '2047-10-29',
                'masa_kerja'        => '10 Tahun 2 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2024-08-01',
                'kgb_berikutnya'    => '2026-08-01',
                'masa_kerja_golongan'=> 12,
                'badge'             => 'PRW-004',
            ],

            // 12 — Perawat Rawat Inap 1
            [
                'nip'               => $nip('1987-03-14', 'P', '2012-05-01', 13),
                'nama'              => 'Siti Rahayu',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'A.Md.Kep',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Klaten',
                'tanggal_lahir'     => '1987-03-14',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Pemuda No. 3, Klaten',
                'no_telp'           => '08121234013',
                'email'             => 'siti.rahayu@rsudam.id',
                'jabatan'           => 'Perawat Terampil',
                'jabatan_fungsional'=> 'Perawat Terampil',
                'unit_kerja'        => 'Instalasi Rawat Inap Bedah',
                'golongan'          => 'II/d',
                'pangkat'           => 'Pengatur Tingkat I',
                'tmt_golongan'      => '2020-05-01',
                'tmt_jabatan'       => '2012-05-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'D3',
                'jurusan'           => 'Keperawatan',
                'institusi'         => 'Politeknik Kesehatan Surakarta',
                'tahun_lulus'       => 2011,
                'tanggal_masuk'     => '2012-05-01',
                'batas_pensiun'     => '2043-03-14',
                'masa_kerja'        => '14 Tahun 5 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2022-05-01',
                'kgb_berikutnya'    => '2026-05-01',
                'masa_kerja_golongan'=> 18,
                'badge'             => 'PRW-005',
            ],

            // 13 — Perawat Rawat Inap 2
            [
                'nip'               => $nip('1993-07-08', 'L', '2019-01-01', 14),
                'nama'              => 'Wahyu Nugroho',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kep., Ns',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Boyolali',
                'tanggal_lahir'     => '1993-07-08',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Belum Menikah',
                'alamat'            => 'Jl. Kates No. 11, Boyolali',
                'no_telp'           => '08121234014',
                'email'             => 'wahyu.nugroho@rsudam.id',
                'jabatan'           => 'Perawat Ahli Pertama',
                'jabatan_fungsional'=> 'Perawat Ahli Pertama',
                'unit_kerja'        => 'Instalasi Rawat Inap Interna',
                'golongan'          => 'III/a',
                'pangkat'           => 'Penata Muda',
                'tmt_golongan'      => '2019-01-01',
                'tmt_jabatan'       => '2019-01-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Ilmu Keperawatan',
                'institusi'         => 'Universitas Muhammadiyah Surakarta',
                'tahun_lulus'       => 2018,
                'tanggal_masuk'     => '2019-01-01',
                'batas_pensiun'     => '2049-07-08',
                'masa_kerja'        => '7 Tahun 9 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-01-01',
                'kgb_berikutnya'    => '2025-01-01',
                'masa_kerja_golongan'=> 6,
                'badge'             => 'PRW-006',
            ],

            // 14 — Perawat VK (Kebidanan)
            [
                'nip'               => $nip('1989-11-22', 'P', '2013-10-01', 15),
                'nama'              => 'Endah Sulistyowati',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'A.Md.Kep',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Wonogiri',
                'tanggal_lahir'     => '1989-11-22',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Melati No. 6, Wonogiri',
                'no_telp'           => '08121234015',
                'email'             => 'endah.sulistyowati@rsudam.id',
                'jabatan'           => 'Perawat Terampil',
                'jabatan_fungsional'=> 'Perawat Terampil',
                'unit_kerja'        => 'Instalasi Kebidanan (VK)',
                'golongan'          => 'II/d',
                'pangkat'           => 'Pengatur Tingkat I',
                'tmt_golongan'      => '2021-10-01',
                'tmt_jabatan'       => '2013-10-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'D3',
                'jurusan'           => 'Keperawatan',
                'institusi'         => 'Politeknik Kesehatan Semarang',
                'tahun_lulus'       => 2012,
                'tanggal_masuk'     => '2013-10-01',
                'batas_pensiun'     => '2045-11-22',
                'masa_kerja'        => '13 Tahun',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-10-01',
                'kgb_berikutnya'    => '2025-10-01',
                'masa_kerja_golongan'=> 24,
                'badge'             => 'PRW-007',
            ],

            // 15 — Perawat Anak
            [
                'nip'               => $nip('1994-05-30', 'P', '2020-03-01', 16),
                'nama'              => 'Fitri Handayani',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kep., Ns',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Karanganyar',
                'tanggal_lahir'     => '1994-05-30',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Lawu No. 18, Karanganyar',
                'no_telp'           => '08121234016',
                'email'             => 'fitri.handayani@rsudam.id',
                'jabatan'           => 'Perawat Ahli Pertama',
                'jabatan_fungsional'=> 'Perawat Ahli Pertama',
                'unit_kerja'        => 'Instalasi Rawat Inap Anak',
                'golongan'          => 'III/a',
                'pangkat'           => 'Penata Muda',
                'tmt_golongan'      => '2020-03-01',
                'tmt_jabatan'       => '2020-03-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Ilmu Keperawatan',
                'institusi'         => 'Universitas Duta Bangsa Surakarta',
                'tahun_lulus'       => 2019,
                'tanggal_masuk'     => '2020-03-01',
                'batas_pensiun'     => '2050-05-30',
                'masa_kerja'        => '6 Tahun 7 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2024-03-01',
                'kgb_berikutnya'    => '2026-03-01',
                'masa_kerja_golongan'=> 6,
                'badge'             => 'PRW-008',
            ],

            // 16 — Bidan 1
            [
                'nip'               => $nip('1986-02-17', 'P', '2011-07-01', 17),
                'nama'              => 'Wulandari Putri',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'A.Md.Keb',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Temanggung',
                'tanggal_lahir'     => '1986-02-17',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Parakan No. 20, Temanggung',
                'no_telp'           => '08121234017',
                'email'             => 'wulandari.putri@rsudam.id',
                'jabatan'           => 'Bidan Terampil',
                'jabatan_fungsional'=> 'Bidan Terampil',
                'unit_kerja'        => 'Instalasi Kebidanan (VK)',
                'golongan'          => 'II/d',
                'pangkat'           => 'Pengatur Tingkat I',
                'tmt_golongan'      => '2021-07-01',
                'tmt_jabatan'       => '2011-07-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'D3',
                'jurusan'           => 'Kebidanan',
                'institusi'         => 'Politeknik Kesehatan Semarang',
                'tahun_lulus'       => 2010,
                'tanggal_masuk'     => '2011-07-01',
                'batas_pensiun'     => '2042-02-17',
                'masa_kerja'        => '15 Tahun 3 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-07-01',
                'kgb_berikutnya'    => '2025-07-01',
                'masa_kerja_golongan'=> 18,
                'badge'             => 'BDN-001',
            ],

            // 17 — Bidan 2
            [
                'nip'               => $nip('1993-09-05', 'P', '2018-11-01', 18),
                'nama'              => 'Ayu Cahyaningrum',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Tr.Keb',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Kebumen',
                'tanggal_lahir'     => '1993-09-05',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Tentara No. 33, Kebumen',
                'no_telp'           => '08121234018',
                'email'             => 'ayu.cahyaningrum@rsudam.id',
                'jabatan'           => 'Bidan Ahli Pertama',
                'jabatan_fungsional'=> 'Bidan Ahli Pertama',
                'unit_kerja'        => 'Instalasi Rawat Inap Anak',
                'golongan'          => 'III/a',
                'pangkat'           => 'Penata Muda',
                'tmt_golongan'      => '2018-11-01',
                'tmt_jabatan'       => '2018-11-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'D4',
                'jurusan'           => 'Kebidanan',
                'institusi'         => 'Politeknik Kesehatan Yogyakarta',
                'tahun_lulus'       => 2018,
                'tanggal_masuk'     => '2018-11-01',
                'batas_pensiun'     => '2049-09-05',
                'masa_kerja'        => '7 Tahun 11 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2022-11-01',
                'kgb_berikutnya'    => '2026-11-01',
                'masa_kerja_golongan'=> 8,
                'badge'             => 'BDN-002',
            ],

            // 18 — Apoteker 1
            [
                'nip'               => $nip('1984-08-12', 'P', '2009-05-01', 19),
                'nama'              => 'Evi Oktaviani',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Farm., Apt',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Banjar',
                'tanggal_lahir'     => '1984-08-12',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Merdeka No. 5, Banjar',
                'no_telp'           => '08121234019',
                'email'             => 'evi.oktaviani@rsudam.id',
                'jabatan'           => 'Apoteker Ahli Muda',
                'jabatan_fungsional'=> 'Apoteker Ahli Muda',
                'unit_kerja'        => 'Instalasi Farmasi',
                'golongan'          => 'III/c',
                'pangkat'           => 'Penata',
                'tmt_golongan'      => '2019-05-01',
                'tmt_jabatan'       => '2009-05-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Farmasi',
                'institusi'         => 'Universitas Jember',
                'tahun_lulus'       => 2008,
                'tanggal_masuk'     => '2009-05-01',
                'batas_pensiun'     => '2040-08-12',
                'masa_kerja'        => '17 Tahun 5 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2021-05-01',
                'kgb_berikutnya'    => '2025-05-01',
                'masa_kerja_golongan'=> 24,
                'badge'             => 'APT-001',
            ],

            // 19 — Apoteker 2
            [
                'nip'               => $nip('1992-04-03', 'L', '2017-06-01', 20),
                'nama'              => 'Rizky Ramadhan',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Farm., Apt',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Cianjur',
                'tanggal_lahir'     => '1992-04-03',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Pasar Anyar No. 9, Cianjur',
                'no_telp'           => '08121234020',
                'email'             => 'rizky.ramadhan@rsudam.id',
                'jabatan'           => 'Apoteker Ahli Pertama',
                'jabatan_fungsional'=> 'Apoteker Ahli Pertama',
                'unit_kerja'        => 'Instalasi Farmasi',
                'golongan'          => 'III/b',
                'pangkat'           => 'Penata Muda Tingkat I',
                'tmt_golongan'      => '2023-06-01',
                'tmt_jabatan'       => '2017-06-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Farmasi',
                'institusi'         => 'Institut Teknologi Bandung',
                'tahun_lulus'       => 2016,
                'tanggal_masuk'     => '2017-06-01',
                'batas_pensiun'     => '2048-04-03',
                'masa_kerja'        => '9 Tahun 4 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2025-06-01',
                'kgb_berikutnya'    => '2027-06-01',
                'masa_kerja_golongan'=> 6,
                'badge'             => 'APT-002',
            ],

            // 20 — Radiografer 1
            [
                'nip'               => $nip('1986-12-19', 'L', '2011-09-01', 21),
                'nama'              => 'Andi Prasetyo',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'A.Md.Rad',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Purbalingga',
                'tanggal_lahir'     => '1986-12-19',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Ahmad Yani No. 7, Purbalingga',
                'no_telp'           => '08121234021',
                'email'             => 'andi.prasetyo@rsudam.id',
                'jabatan'           => 'Radiografer Terampil',
                'jabatan_fungsional'=> 'Radiografer Terampil',
                'unit_kerja'        => 'Instalasi Radiologi',
                'golongan'          => 'II/d',
                'pangkat'           => 'Pengatur Tingkat I',
                'tmt_golongan'      => '2021-09-01',
                'tmt_jabatan'       => '2011-09-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'D3',
                'jurusan'           => 'Radiologi',
                'institusi'         => 'Politeknik Kesehatan Semarang',
                'tahun_lulus'       => 2010,
                'tanggal_masuk'     => '2011-09-01',
                'batas_pensiun'     => '2042-12-19',
                'masa_kerja'        => '15 Tahun 1 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-09-01',
                'kgb_berikutnya'    => '2025-09-01',
                'masa_kerja_golongan'=> 18,
                'badge'             => 'RAD-001',
            ],

            // 21 — Radiografer 2
            [
                'nip'               => $nip('1994-03-27', 'P', '2019-08-01', 22),
                'nama'              => 'Dini Setiowati',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Tr.Kes',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Cilacap',
                'tanggal_lahir'     => '1994-03-27',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Belum Menikah',
                'alamat'            => 'Jl. Gatot Subroto No. 15, Cilacap',
                'no_telp'           => '08121234022',
                'email'             => 'dini.setiowati@rsudam.id',
                'jabatan'           => 'Radiografer Terampil',
                'jabatan_fungsional'=> 'Radiografer Terampil',
                'unit_kerja'        => 'Instalasi Radiologi',
                'golongan'          => 'II/c',
                'pangkat'           => 'Pengatur',
                'tmt_golongan'      => '2019-08-01',
                'tmt_jabatan'       => '2019-08-01',
                'status_pegawai'    => 'PPPK',
                'pendidikan_terakhir'=> 'D4',
                'jurusan'           => 'Teknologi Radiologi Pencitraan',
                'institusi'         => 'Politeknik Kesehatan Surakarta',
                'tahun_lulus'       => 2019,
                'tanggal_masuk'     => '2019-08-01',
                'batas_pensiun'     => '2050-03-27',
                'masa_kerja'        => '7 Tahun 2 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2023-08-01',
                'kgb_berikutnya'    => '2025-08-01',
                'masa_kerja_golongan'=> 6,
                'badge'             => 'RAD-002',
            ],

            // 22 — Laboran 1
            [
                'nip'               => $nip('1985-06-10', 'P', '2010-11-01', 23),
                'nama'              => 'Tri Astuti',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'A.Md.AK',
                'jenis_kelamin'     => 'P',
                'tempat_lahir'      => 'Banjarnegara',
                'tanggal_lahir'     => '1985-06-10',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Raya Banjarnegara No. 11',
                'no_telp'           => '08121234023',
                'email'             => 'tri.astuti@rsudam.id',
                'jabatan'           => 'Pranata Laboratorium Terampil',
                'jabatan_fungsional'=> 'Pranata Laboratorium Terampil',
                'unit_kerja'        => 'Instalasi Laboratorium',
                'golongan'          => 'II/d',
                'pangkat'           => 'Pengatur Tingkat I',
                'tmt_golongan'      => '2020-11-01',
                'tmt_jabatan'       => '2010-11-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'D3',
                'jurusan'           => 'Analis Kesehatan',
                'institusi'         => 'Politeknik Kesehatan Semarang',
                'tahun_lulus'       => 2009,
                'tanggal_masuk'     => '2010-11-01',
                'batas_pensiun'     => '2041-06-10',
                'masa_kerja'        => '16 Tahun',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2022-11-01',
                'kgb_berikutnya'    => '2024-11-01',
                'masa_kerja_golongan'=> 24,
                'badge'             => 'LAB-001',
            ],

            // 23 — Laboran 2
            [
                'nip'               => $nip('1991-01-15', 'L', '2016-02-01', 24),
                'nama'              => 'Joko Prabowo',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'A.Md.AK',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Demak',
                'tanggal_lahir'     => '1991-01-15',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Menikah',
                'alamat'            => 'Jl. Sultan Fattah No. 5, Demak',
                'no_telp'           => '08121234024',
                'email'             => 'joko.prabowo@rsudam.id',
                'jabatan'           => 'Pranata Laboratorium Terampil',
                'jabatan_fungsional'=> 'Pranata Laboratorium Terampil',
                'unit_kerja'        => 'Instalasi Laboratorium',
                'golongan'          => 'II/c',
                'pangkat'           => 'Pengatur',
                'tmt_golongan'      => '2020-02-01',
                'tmt_jabatan'       => '2016-02-01',
                'status_pegawai'    => 'PNS',
                'pendidikan_terakhir'=> 'D3',
                'jurusan'           => 'Analis Kesehatan',
                'institusi'         => 'Politeknik Kesehatan Semarang',
                'tahun_lulus'       => 2015,
                'tanggal_masuk'     => '2016-02-01',
                'batas_pensiun'     => '2047-01-15',
                'masa_kerja'        => '10 Tahun 8 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => '2024-02-01',
                'kgb_berikutnya'    => '2026-02-01',
                'masa_kerja_golongan'=> 12,
                'badge'             => 'LAB-002',
            ],

            // 24 — Staf IT SIMRS (Honorer)
            [
                'nip'               => 'HON-IT-2021-001',
                'nama'              => 'Gilang Ramadhan Putra',
                'gelar_depan'       => null,
                'gelar_belakang'    => 'S.Kom',
                'jenis_kelamin'     => 'L',
                'tempat_lahir'      => 'Semarang',
                'tanggal_lahir'     => '1997-05-23',
                'agama'             => 'Islam',
                'status_perkawinan' => 'Belum Menikah',
                'alamat'            => 'Jl. Simongan No. 44, Semarang',
                'no_telp'           => '08121234025',
                'email'             => 'gilang.ramadhan@rsudam.id',
                'jabatan'           => 'Staf IT SIMRS',
                'jabatan_fungsional'=> null,
                'unit_kerja'        => 'Bagian IT & Rekam Medis',
                'golongan'          => null,
                'pangkat'           => null,
                'tmt_golongan'      => null,
                'tmt_jabatan'       => '2021-06-01',
                'status_pegawai'    => 'Honorer',
                'pendidikan_terakhir'=> 'S1',
                'jurusan'           => 'Sistem Informasi',
                'institusi'         => 'Universitas Dian Nuswantoro',
                'tahun_lulus'       => 2020,
                'tanggal_masuk'     => '2021-06-01',
                'batas_pensiun'     => null,
                'masa_kerja'        => '5 Tahun 4 Bulan',
                'eselon'            => null,
                'tmt_gaji_berkala'  => null,
                'kgb_berikutnya'    => null,
                'masa_kerja_golongan'=> null,
                'badge'             => 'IT-001',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Cuti
    // -------------------------------------------------------------------------
    private function seedCuti(): void
    {
        $ids = DB::table('m_pegawai')->orderBy('id')->pluck('id')->toArray();
        $direktur = DB::table('m_pegawai')->where('jabatan', 'Direktur RSUD')->value('nama');

        $records = [
            // Pending (3)
            [
                'pegawai_id'       => $ids[5],  // Ferdy (Dokter Umum IGD)
                'jenis_cuti'       => 'Cuti Tahunan',
                'tanggal_mulai'    => Carbon::now()->addDays(7)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->addDays(13)->toDateString(),
                'jumlah_hari'      => 5,
                'alasan'           => 'Keperluan keluarga di kampung halaman',
                'alamat_selama_cuti'=> 'Jl. Kebon Sirih No. 5, Jakarta',
                'no_telp_cuti'     => '08121234006',
                'status'           => 'Pending',
                'tanggal_pengajuan'=> Carbon::now()->subDays(2)->toDateString(),
            ],
            [
                'pegawai_id'       => $ids[9],  // Rina Marlina (Perawat IGD)
                'jenis_cuti'       => 'Cuti Tahunan',
                'tanggal_mulai'    => Carbon::now()->addDays(14)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->addDays(19)->toDateString(),
                'jumlah_hari'      => 4,
                'alasan'           => 'Pernikahan adik kandung',
                'alamat_selama_cuti'=> 'Jl. HZ. Mustofa No. 14, Tasikmalaya',
                'no_telp_cuti'     => '08121234010',
                'status'           => 'Pending',
                'tanggal_pengajuan'=> Carbon::now()->subDays(1)->toDateString(),
            ],
            [
                'pegawai_id'       => $ids[14], // Endah (Perawat VK)
                'jenis_cuti'       => 'Cuti Sakit',
                'tanggal_mulai'    => Carbon::now()->toDateString(),
                'tanggal_selesai'  => Carbon::now()->addDays(2)->toDateString(),
                'jumlah_hari'      => 3,
                'alasan'           => 'Sakit demam berdarah, lampiran surat dokter terlampir',
                'alamat_selama_cuti'=> 'Jl. Melati No. 6, Wonogiri',
                'no_telp_cuti'     => '08121234015',
                'status'           => 'Pending',
                'tanggal_pengajuan'=> Carbon::now()->toDateString(),
            ],
            // Disetujui (2)
            [
                'pegawai_id'       => $ids[3],  // Dewi (Sp.A)
                'jenis_cuti'       => 'Cuti Tahunan',
                'tanggal_mulai'    => Carbon::now()->subDays(20)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->subDays(15)->toDateString(),
                'jumlah_hari'      => 5,
                'alasan'           => 'Liburan keluarga',
                'alamat_selama_cuti'=> 'Jl. Dago No. 10, Bandung',
                'no_telp_cuti'     => '08121234004',
                'status'           => 'Disetujui',
                'disetujui_oleh'   => $direktur,
                'tanggal_pengajuan'=> Carbon::now()->subDays(25)->toDateString(),
                'tanggal_disetujui'=> Carbon::now()->subDays(23)->toDateString(),
            ],
            [
                'pegawai_id'       => $ids[18], // Evi (Apoteker)
                'jenis_cuti'       => 'Cuti Tahunan',
                'tanggal_mulai'    => Carbon::now()->subDays(10)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->subDays(6)->toDateString(),
                'jumlah_hari'      => 3,
                'alasan'           => 'Menghadiri wisuda anak',
                'alamat_selama_cuti'=> 'Jl. Merdeka No. 5, Banjar',
                'no_telp_cuti'     => '08121234019',
                'status'           => 'Disetujui',
                'disetujui_oleh'   => $direktur,
                'tanggal_pengajuan'=> Carbon::now()->subDays(14)->toDateString(),
                'tanggal_disetujui'=> Carbon::now()->subDays(12)->toDateString(),
            ],
            // Ditolak (1)
            [
                'pegawai_id'       => $ids[13], // Wahyu (Perawat RI)
                'jenis_cuti'       => 'Cuti Tahunan',
                'tanggal_mulai'    => Carbon::now()->subDays(5)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->addDays(5)->toDateString(),
                'jumlah_hari'      => 8,
                'alasan'           => 'Rencana perjalanan luar kota',
                'alamat_selama_cuti'=> 'Jl. Kates No. 11, Boyolali',
                'no_telp_cuti'     => '08121234014',
                'status'           => 'Ditolak',
                'disetujui_oleh'   => null,
                'catatan'          => 'Tidak dapat disetujui — tidak ada pengganti shift pada periode tersebut.',
                'tanggal_pengajuan'=> Carbon::now()->subDays(8)->toDateString(),
                'tanggal_disetujui'=> null,
            ],
            // Historis (2 — tahun lalu)
            [
                'pegawai_id'       => $ids[1],  // Rudi (Sp.B)
                'jenis_cuti'       => 'Cuti Tahunan',
                'tanggal_mulai'    => Carbon::now()->subYear()->setMonth(8)->setDay(5)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->subYear()->setMonth(8)->setDay(11)->toDateString(),
                'jumlah_hari'      => 5,
                'alasan'           => 'Liburan akhir tahun bersama keluarga',
                'alamat_selama_cuti'=> 'Jl. Veteran No. 45, Surabaya',
                'no_telp_cuti'     => '08121234002',
                'status'           => 'Disetujui',
                'disetujui_oleh'   => $direktur,
                'tanggal_pengajuan'=> Carbon::now()->subYear()->setMonth(8)->setDay(1)->toDateString(),
                'tanggal_disetujui'=> Carbon::now()->subYear()->setMonth(8)->setDay(3)->toDateString(),
            ],
            [
                'pegawai_id'       => $ids[16], // Wulandari (Bidan)
                'jenis_cuti'       => 'Cuti Melahirkan',
                'tanggal_mulai'    => Carbon::now()->subYears(2)->setMonth(3)->setDay(1)->toDateString(),
                'tanggal_selesai'  => Carbon::now()->subYears(2)->setMonth(5)->setDay(29)->toDateString(),
                'jumlah_hari'      => 90,
                'alasan'           => 'Melahirkan anak pertama',
                'alamat_selama_cuti'=> 'Jl. Parakan No. 20, Temanggung',
                'no_telp_cuti'     => '08121234017',
                'status'           => 'Disetujui',
                'disetujui_oleh'   => $direktur,
                'tanggal_pengajuan'=> Carbon::now()->subYears(2)->setMonth(2)->setDay(20)->toDateString(),
                'tanggal_disetujui'=> Carbon::now()->subYears(2)->setMonth(2)->setDay(22)->toDateString(),
            ],
        ];

        foreach ($records as $r) {
            DB::table('t_cuti')->insert(array_merge([
                'disetujui_oleh'    => null,
                'tanggal_disetujui' => null,
                'lampiran'          => null,
                'catatan'           => null,
            ], $r, ['created_at' => now(), 'updated_at' => now()]));
        }
    }

    // -------------------------------------------------------------------------
    // Absensi — 20 hari kerja terakhir, semua 25 pegawai
    // -------------------------------------------------------------------------
    private function seedAbsensi(): void
    {
        $pegawaiIds = DB::table('m_pegawai')->pluck('id')->toArray();
        $workDays   = $this->lastWorkingDays(20);
        $rows       = [];

        foreach ($workDays as $date) {
            foreach ($pegawaiIds as $idx => $pid) {
                // Deterministic "random" per pegawai + date so reruns are stable
                $seed   = crc32($pid . $date);
                $pct    = abs($seed % 100); // 0-99

                if ($pct < 95) {
                    // Hadir — 95%
                    $menit  = abs(crc32($pid . $date . 'l') % 61); // 0-60 min after 07:30
                    $jamIn  = Carbon::createFromTime(7, 30)->addMinutes($menit)->format('H:i:s');
                    $jamOut = Carbon::createFromTime(15, 30)->addMinutes(abs(crc32($pid . $date . 'o') % 91))->format('H:i:s');
                    $telat  = max(0, $menit - 30); // Terlambat jika > 08:00

                    $rows[] = [
                        'pegawai_id'       => $pid,
                        'tanggal'          => $date,
                        'jam_masuk'        => $jamIn,
                        'jam_keluar'       => $jamOut,
                        'status'           => $telat > 0 ? 'Hadir' : 'Hadir',
                        'menit_terlambat'  => $telat,
                        'menit_pulang_cepat' => 0,
                        'jenis_shift'      => 'Pagi',
                        'keterangan'       => $telat > 0 ? "Terlambat {$telat} menit" : null,
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                } elseif ($pct < 98) {
                    // Terlambat signifikan — 3%
                    $menit  = 31 + abs(crc32($pid . $date . 't') % 45); // 31-75 min terlambat
                    $jamIn  = Carbon::createFromTime(8, 0)->addMinutes($menit)->format('H:i:s');
                    $jamOut = Carbon::createFromTime(16, 0)->addMinutes(abs(crc32($pid . $date . 'o2') % 60))->format('H:i:s');

                    $rows[] = [
                        'pegawai_id'       => $pid,
                        'tanggal'          => $date,
                        'jam_masuk'        => $jamIn,
                        'jam_keluar'       => $jamOut,
                        'status'           => 'Hadir',
                        'menit_terlambat'  => $menit,
                        'menit_pulang_cepat' => 0,
                        'jenis_shift'      => 'Pagi',
                        'keterangan'       => "Terlambat {$menit} menit",
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                } elseif ($pct === 98) {
                    // Alpha — ~1%
                    $rows[] = [
                        'pegawai_id'       => $pid,
                        'tanggal'          => $date,
                        'jam_masuk'        => null,
                        'jam_keluar'       => null,
                        'status'           => 'Alpha',
                        'menit_terlambat'  => 0,
                        'menit_pulang_cepat' => 0,
                        'jenis_shift'      => 'Pagi',
                        'keterangan'       => 'Tidak hadir tanpa keterangan',
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                } else {
                    // Izin — ~1%
                    $rows[] = [
                        'pegawai_id'       => $pid,
                        'tanggal'          => $date,
                        'jam_masuk'        => null,
                        'jam_keluar'       => null,
                        'status'           => 'Izin',
                        'menit_terlambat'  => 0,
                        'menit_pulang_cepat' => 0,
                        'jenis_shift'      => 'Pagi',
                        'keterangan'       => 'Izin keperluan mendadak',
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                }
            }
        }

        // Chunk inserts to avoid packet-size issues
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('t_absensi')->insertOrIgnore($chunk);
        }
    }

    // -------------------------------------------------------------------------
    // SKP
    // -------------------------------------------------------------------------
    private function seedSKP(): void
    {
        $ids     = DB::table('m_pegawai')->orderBy('id')->pluck('id')->toArray();
        $penilai = $ids[0]; // Direktur sebagai pejabat penilai default
        $tahun   = now()->year;

        $predikat = function (float $nilai): string {
            return match (true) {
                $nilai >= 90 => 'Sangat Baik',
                $nilai >= 76 => 'Baik',
                $nilai >= 61 => 'Cukup',
                $nilai >= 51 => 'Kurang',
                default      => 'Sangat Kurang',
            };
        };

        // 15 Disetujui — nilai 75–98
        $nilaiDisetujui = [98, 95, 93, 91, 90, 88, 87, 85, 84, 83, 81, 80, 79, 77, 76];
        for ($i = 0; $i < 15; $i++) {
            $nilai = (float) $nilaiDisetujui[$i];
            DB::table('t_skp_header')->insert([
                'pegawai_id'          => $ids[$i],
                'tahun'               => $tahun,
                'semester'            => 1,
                'nilai_hasil_kerja'   => round($nilai * 0.6, 2),
                'nilai_perilaku'      => round($nilai * 0.4, 2),
                'nilai_akhir'         => $nilai,
                'predikat'            => $predikat($nilai),
                'status'              => 'Disetujui',
                'pejabat_penilai_id'  => $penilai,
                'catatan_atasan'      => 'Kinerja baik, perlu ditingkatkan pada aspek dokumentasi.',
                'tanggal_penilaian'   => Carbon::create($tahun, 6, 30)->toDateString(),
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }

        // 5 Dinilai
        for ($i = 15; $i < 20; $i++) {
            DB::table('t_skp_header')->insert([
                'pegawai_id'          => $ids[$i],
                'tahun'               => $tahun,
                'semester'            => 1,
                'nilai_hasil_kerja'   => 0,
                'nilai_perilaku'      => 0,
                'nilai_akhir'         => 0,
                'predikat'            => 'Baik',
                'status'              => 'Dinilai',
                'pejabat_penilai_id'  => $penilai,
                'catatan_atasan'      => null,
                'tanggal_penilaian'   => null,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }

        // 5 Draft / Diajukan
        $statuses = ['Draft', 'Draft', 'Diajukan', 'Diajukan', 'Draft'];
        for ($i = 20; $i < 25; $i++) {
            DB::table('t_skp_header')->insert([
                'pegawai_id'          => $ids[$i],
                'tahun'               => $tahun,
                'semester'            => 1,
                'nilai_hasil_kerja'   => 0,
                'nilai_perilaku'      => 0,
                'nilai_akhir'         => 0,
                'predikat'            => 'Baik',
                'status'              => $statuses[$i - 20],
                'pejabat_penilai_id'  => null,
                'catatan_atasan'      => null,
                'tanggal_penilaian'   => null,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Penghargaan
    // -------------------------------------------------------------------------
    private function seedPenghargaan(): void
    {
        $ids = DB::table('m_pegawai')->orderBy('id')->pluck('id')->toArray();

        $records = [
            // Pegawai Teladan — Internal RS (3)
            [
                'pegawai_id'       => $ids[8],   // Hendra (Perawat IGD)
                'nama_penghargaan' => 'Pegawai Teladan RSUD Semester I ' . (now()->year - 1),
                'jenis'            => 'Pegawai Teladan',
                'pemberi'          => 'Direktur RSUD',
                'level'            => 'Internal',
                'tanggal'          => Carbon::create(now()->year - 1, 7, 17)->toDateString(),
                'deskripsi'        => 'Penghargaan atas dedikasi dan kinerja terbaik sebagai perawat IGD.',
            ],
            [
                'pegawai_id'       => $ids[18],  // Evi (Apoteker)
                'nama_penghargaan' => 'Pegawai Teladan RSUD Semester II ' . (now()->year - 1),
                'jenis'            => 'Pegawai Teladan',
                'pemberi'          => 'Direktur RSUD',
                'level'            => 'Internal',
                'tanggal'          => Carbon::create(now()->year - 1, 12, 17)->toDateString(),
                'deskripsi'        => 'Inovasi dalam pengelolaan obat generik berhasil menghemat anggaran 15%.',
            ],
            [
                'pegawai_id'       => $ids[2],   // Sri Wahyuni (Sp.PD)
                'nama_penghargaan' => 'Dokter Terbaik RSUD ' . now()->year,
                'jenis'            => 'Pegawai Teladan',
                'pemberi'          => 'Direktur RSUD',
                'level'            => 'Internal',
                'tanggal'          => Carbon::create(now()->year, 7, 17)->toDateString(),
                'deskripsi'        => 'Penghargaan atas tingkat kepuasan pasien tertinggi pada layanan rawat inap.',
            ],
            // Dedikasi — Provinsi (2)
            [
                'pegawai_id'       => $ids[1],   // Rudi (Sp.B)
                'nama_penghargaan' => 'Tenaga Medis Berdedikasi Provinsi Jawa Tengah ' . (now()->year - 2),
                'jenis'            => 'Dedikasi',
                'pemberi'          => 'Gubernur Jawa Tengah',
                'level'            => 'Provinsi',
                'tanggal'          => Carbon::create(now()->year - 2, 11, 10)->toDateString(),
                'deskripsi'        => 'Pengabdian selama 15 tahun dalam pelayanan bedah di daerah terpencil.',
            ],
            [
                'pegawai_id'       => $ids[0],   // Direktur
                'nama_penghargaan' => 'Pemimpin Inovatif Bidang Kesehatan Provinsi ' . (now()->year - 1),
                'jenis'            => 'Dedikasi',
                'pemberi'          => 'Dinas Kesehatan Provinsi Jawa Tengah',
                'level'            => 'Provinsi',
                'tanggal'          => Carbon::create(now()->year - 1, 5, 2)->toDateString(),
                'deskripsi'        => 'Berhasil meningkatkan akreditasi RS dari Madya ke Paripurna.',
            ],
            // Inovasi — Nasional (1)
            [
                'pegawai_id'       => $ids[24],  // Gilang (IT)
                'nama_penghargaan' => 'Inovasi SIMRS Terbaik Nasional ' . (now()->year - 1),
                'jenis'            => 'Inovasi',
                'pemberi'          => 'Kementerian Kesehatan RI',
                'level'            => 'Nasional',
                'tanggal'          => Carbon::create(now()->year - 1, 10, 28)->toDateString(),
                'deskripsi'        => 'Pengembangan modul integrasi SIMRS-BPJS yang berhasil mengurangi antrian 40%.',
            ],
        ];

        foreach ($records as $r) {
            DB::table('t_penghargaan_pegawai')->insert(array_merge($r, [
                'file_sertifikat' => null,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]));
        }
    }

    // -------------------------------------------------------------------------
    // Komite RS
    // -------------------------------------------------------------------------
    private function seedKomite(): void
    {
        $ids = DB::table('m_pegawai')->orderBy('id')->pluck('id')->toArray();

        // Komite Medik
        $komiteMedikId = DB::table('m_komite_rs')->insertGetId([
            'nama_komite'         => 'Komite Medik',
            'singkatan'           => 'KOMMED',
            'ketua_pegawai_id'    => $ids[0], // Direktur
            'nomor_sk_pendirian'  => 'SK/DIR/001/2020',
            'tanggal_sk'          => '2020-01-15',
            'deskripsi_tugas'     => 'Menjaga dan meningkatkan profesionalisme tenaga medis melalui kredensial, mutu profesi, dan etika disiplin.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        // Anggota Komite Medik (5 dokter)
        $anggotaMedik = [
            ['id' => $ids[0], 'jabatan' => 'Ketua'],
            ['id' => $ids[1], 'jabatan' => 'Sekretaris'],
            ['id' => $ids[2], 'jabatan' => 'Subkomite Kredensial'],
            ['id' => $ids[3], 'jabatan' => 'Subkomite Mutu Profesi'],
            ['id' => $ids[4], 'jabatan' => 'Anggota'],
        ];
        foreach ($anggotaMedik as $a) {
            DB::table('t_anggota_komite')->insert([
                'komite_id'          => $komiteMedikId,
                'pegawai_id'         => $a['id'],
                'jabatan_di_komite'  => $a['jabatan'],
                'tanggal_bergabung'  => '2020-01-15',
                'tanggal_berakhir'   => null,
                'status'             => 'Aktif',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        // Komite Keperawatan
        $komiteKepId = DB::table('m_komite_rs')->insertGetId([
            'nama_komite'         => 'Komite Keperawatan',
            'singkatan'           => 'KOMKEP',
            'ketua_pegawai_id'    => $ids[8], // Hendra (Perawat IGD senior)
            'nomor_sk_pendirian'  => 'SK/DIR/002/2020',
            'tanggal_sk'          => '2020-01-15',
            'deskripsi_tugas'     => 'Mengatur tata kelola keperawatan, kredensial perawat, dan peningkatan mutu asuhan keperawatan.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        $anggotaKep = [
            ['id' => $ids[8],  'jabatan' => 'Ketua'],
            ['id' => $ids[10], 'jabatan' => 'Sekretaris'],
            ['id' => $ids[12], 'jabatan' => 'Subkomite Kredensial'],
            ['id' => $ids[15], 'jabatan' => 'Anggota'],
        ];
        foreach ($anggotaKep as $a) {
            DB::table('t_anggota_komite')->insert([
                'komite_id'          => $komiteKepId,
                'pegawai_id'         => $a['id'],
                'jabatan_di_komite'  => $a['jabatan'],
                'tanggal_bergabung'  => '2020-01-15',
                'tanggal_berakhir'   => null,
                'status'             => 'Aktif',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        // Komite K3RS
        $komiteK3Id = DB::table('m_komite_rs')->insertGetId([
            'nama_komite'         => 'Komite Kesehatan dan Keselamatan Kerja RS',
            'singkatan'           => 'K3RS',
            'ketua_pegawai_id'    => $ids[5], // Ferdy (Dokter Umum IGD)
            'nomor_sk_pendirian'  => 'SK/DIR/003/2021',
            'tanggal_sk'          => '2021-03-01',
            'deskripsi_tugas'     => 'Menjamin keselamatan dan kesehatan kerja seluruh staf, pasien, dan pengunjung RS sesuai Permenkes No. 66/2016.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        $anggotaK3 = [
            ['id' => $ids[5],  'jabatan' => 'Ketua'],
            ['id' => $ids[20], 'jabatan' => 'Sekretaris'],  // Andi (Radiografer)
            ['id' => $ids[22], 'jabatan' => 'Anggota'],     // Tri Astuti (Laboran)
        ];
        foreach ($anggotaK3 as $a) {
            DB::table('t_anggota_komite')->insert([
                'komite_id'          => $komiteK3Id,
                'pegawai_id'         => $a['id'],
                'jabatan_di_komite'  => $a['jabatan'],
                'tanggal_bergabung'  => '2021-03-01',
                'tanggal_berakhir'   => null,
                'status'             => 'Aktif',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Helper: last N working days (Mon–Fri, skipping today if needed)
    // -------------------------------------------------------------------------
    private function lastWorkingDays(int $count): array
    {
        $days = [];
        $date = Carbon::yesterday();
        while (count($days) < $count) {
            if (!$date->isWeekend()) {
                $days[] = $date->toDateString();
            }
            $date->subDay();
        }
        return array_reverse($days);
    }
}
