import XLSX from 'xlsx';
import path from 'path';

async function inspectExcelFields() {
  try {
    const excelPath = path.join(process.cwd(), 'APT CERVINIA CLEANING.xlsx');
    const workbook = XLSX.readFile(excelPath);

    console.log('📊 Analizando estructura del Excel...\n');
    console.log(`📁 Hojas encontradas: ${workbook.SheetNames.length}\n`);

    // Analizar la primera hoja para ver todos los campos
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

    console.log('📋 Campos encontrados en la primera propiedad:\n');
    
    const fields: string[] = [];
    data.forEach((row: unknown[]) => {
      if (row[0] && typeof row[0] === 'string' && row[0].trim()) {
        const fieldName = row[0].toString().trim();
        const fieldValue = row[1] ? row[1].toString().trim() : '';
        if (fieldName && !fields.includes(fieldName)) {
          fields.push(fieldName);
          console.log(`   - ${fieldName}: ${fieldValue.substring(0, 50)}${fieldValue.length > 50 ? '...' : ''}`);
        }
      }
    });

    console.log(`\n✅ Total de campos únicos encontrados: ${fields.length}\n`);
    
    return fields;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

inspectExcelFields();

