import XLSX from 'xlsx';
import path from 'path';

async function inspectSheetNames() {
  try {
    const excelPath = path.join(process.cwd(), 'APT CERVINIA CLEANING.xlsx');
    const workbook = XLSX.readFile(excelPath);

    console.log('📊 Analizando nombres de hojas del Excel...\n');
    console.log(`📁 Total de hojas: ${workbook.SheetNames.length}\n`);

    const codes: Array<{ sheetName: string; code?: string }> = [];

    workbook.SheetNames.forEach((sheetName) => {
      // Buscar códigos como Q427, Q456, etc. (letra seguida de números)
      const codeMatch = sheetName.match(/([A-Z]\d+)/);
      const code = codeMatch ? codeMatch[1] : undefined;
      
      codes.push({ sheetName, code });
      
      if (code) {
        console.log(`✅ ${sheetName} → Código: ${code}`);
      } else {
        console.log(`   ${sheetName} → Sin código`);
      }
    });

    const codesFound = codes.filter(c => c.code);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Hojas con código: ${codesFound.length}`);
    console.log(`   - Hojas sin código: ${codes.length - codesFound.length}\n`);

    return codes;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

inspectSheetNames();

