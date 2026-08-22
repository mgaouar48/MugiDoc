/**
 * Utilitaires d'exportation de données (CSV, Excel, PDF)
 */

// Exportation en fichier CSV compatible Excel (UTF-8 avec BOM)
export const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvRows: string[] = [];

  // En-têtes
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'));

  // Lignes de données
  for (const row of rows) {
    const values = headers.map(header => {
      const val = row[header];
      const valStr = val === null || val === undefined ? '' : String(val);
      return `"${valStr.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(';'));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportation au format HTML/XLS compatible Excel natif
export const exportToExcel = (filename: string, sheetTitle: string, rows: Record<string, any>[]) => {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${sheetTitle}</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      th { background-color: #1e3a8a; color: white; font-weight: bold; }
      td, th { border: 1px solid #cbd5e1; padding: 6px 12px; font-family: sans-serif; font-size: 12px; }
    </style>
  </head>
  <body>
    <h2>${sheetTitle} - Export MugiDoc</h2>
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `<tr>${headers.map(h => `<td>${row[h] !== undefined && row[h] !== null ? row[h] : ''}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
