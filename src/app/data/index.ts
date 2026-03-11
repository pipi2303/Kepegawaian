/**
 * Barrel export file untuk data HCMS
 * File ini memungkinkan tree-shaking yang lebih baik dengan re-export individual
 */

// Re-export constants (file kecil, frequently used)
export { PANGKAT_GOLONGAN, JENIS_CUTI, UNIT_KERJA } from './constants';

// Re-export semua dari mockData untuk backward compatibility
// Vite akan melakukan tree shaking jika hanya sebagian yang di-import
export {
  dataPegawai,
  dataAbsensi,
  dataCuti,
  sisaCuti,
  dataRiwayatJabatan,
  dataKenaikanPangkat,
  dataSKP,
  chartKehadiran,
  chartGolongan,
  chartUnitKerja,
} from './mockData';