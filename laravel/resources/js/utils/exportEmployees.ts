import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '../pages/EmployeeManagement';

/**
 * Format full name with front and back academic/professional titles.
 */
function getFullName(emp: Employee): string {
  const depan = emp.gelar_depan ? `${emp.gelar_depan} ` : '';
  const belakang = emp.gelar_belakang ? `, ${emp.gelar_belakang}` : '';
  return `${depan}${emp.nama}${belakang}`;
}

/**
 * Formats a Date object to Indonesian date format: e.g. "30 September 2026, 13:45 WIB"
 */
function formatIndoDate(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

export interface ExportOptions {
  filename?: string;
  filterLabel?: string;
  printedBy?: string;
}

/**
 * Export employee list to a formatted, printable PDF document using jsPDF & autoTable.
 */
export function exportEmployeesToPdf(
  employees: Employee[],
  options: ExportOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const filterLabel = options.filterLabel || 'Semua Unit Kerja & Status';
  const printedBy = options.printedBy || 'Administrator Kepegawaian RSUDAM';
  const printDate = formatIndoDate();

  // Header Banner & Branding
  doc.setFillColor(1, 62, 55); // #013E37 Hospital Emerald
  doc.rect(14, 10, 269, 3, 'F');

  // Hospital Letterhead Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(1, 62, 55);
  doc.text('RSUD Dr. H. ABDUL MOELOEK PROVINSI LAMPUNG', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Jl. Dr. Rivai No.6, Penengahan, Kec. Kedaton, Kota Bandar Lampung, Lampung 35112', 14, 25);
  doc.text('Sistem Informasi Manajemen Sumber Daya Manusia (HCMS RSUDAM)', 14, 29);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('DAFTAR REKAPITULASI DATA PEGAWAI RUMAH SAKIT', 14, 38);

  // Metadata Bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Kriteria Filter: ${filterLabel}`, 14, 43);
  doc.text(`Total Data: ${employees.length} Pegawai`, 14, 47);
  doc.text(`Waktu Cetak: ${printDate} | Operator: ${printedBy}`, 160, 47);

  // Table Data Mapping
  const tableRows = employees.map((emp, index) => [
    (index + 1).toString(),
    emp.nip,
    getFullName(emp),
    emp.jabatan,
    emp.unit_kerja,
    emp.status_pegawai,
    emp.golongan ? `Gol. ${emp.golongan}` : '-',
    emp.status_aktif,
    emp.no_telp || emp.email || '-',
  ]);

  // Generate Table via autoTable
  autoTable(doc, {
    startY: 51,
    head: [[
      'No',
      'NIP',
      'Nama Lengkap & Gelar',
      'Jabatan / Profesi',
      'Unit Kerja',
      'Status',
      'Gol.',
      'Keaktifan',
      'Kontak',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [1, 62, 55], // #013E37
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 38 }, // NIP
      2: { cellWidth: 48, fontStyle: 'bold' }, // Nama
      3: { cellWidth: 48 }, // Jabatan
      4: { cellWidth: 42 }, // Unit
      5: { halign: 'center', cellWidth: 18 }, // Status
      6: { halign: 'center', cellWidth: 16 }, // Golongan
      7: { halign: 'center', cellWidth: 18 }, // Keaktifan
      8: { cellWidth: 31 }, // Kontak
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Page numbering footer
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Resmi HCMS RSUD Dr. H. Abdul Moeloek — Halaman ${data.pageNumber} dari ${pageNumber}`,
        14,
        doc.internal.pageSize.height - 8
      );
      doc.text(
        'Dicetak secara otomatis melalui Sistem Kepegawaian Rumah Sakit',
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 8,
        { align: 'right' }
      );
    },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFilename = options.filename || `Daftar_Pegawai_RSUDAM_${timestamp}.pdf`;
  doc.save(finalFilename);
}

/**
 * Export employee list to a spreadsheet (Excel CSV with UTF-8 BOM to prevent character corruption).
 * Formats NIP properly so Excel does not convert numbers to scientific notation.
 */
export function exportEmployeesToExcel(
  employees: Employee[],
  options: ExportOptions = {}
): void {
  const headers = [
    'No',
    'NIP',
    'Nama Lengkap',
    'Gelar Depan',
    'Gelar Belakang',
    'Jenis Kelamin',
    'Jabatan',
    'Unit Kerja',
    'Status Pegawai',
    'Golongan',
    'Pangkat',
    'Status Aktif',
    'Email',
    'No Telepon',
  ];

  // Helper to escape CSV fields safely
  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = employees.map((emp, index) => [
    index + 1,
    // Prepend single quote or tab to keep NIP as exact string in Excel
    `'${emp.nip}`,
    escapeCsv(getFullName(emp)),
    escapeCsv(emp.gelar_depan || ''),
    escapeCsv(emp.gelar_belakang || ''),
    escapeCsv(emp.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'),
    escapeCsv(emp.jabatan),
    escapeCsv(emp.unit_kerja),
    escapeCsv(emp.status_pegawai),
    escapeCsv(emp.golongan || ''),
    escapeCsv(emp.pangkat || ''),
    escapeCsv(emp.status_aktif),
    escapeCsv(emp.email || ''),
    escapeCsv(emp.no_telp || ''),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel recognition
    [
      headers.map(escapeCsv).join(';'),
      ...rows.map((r) => r.join(';')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFilename = options.filename || `Data_Pegawai_RSUDAM_${timestamp}.csv`;

  // Download trigger
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
