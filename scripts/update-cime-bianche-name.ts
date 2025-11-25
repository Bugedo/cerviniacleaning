import { getGoogleSheetsClient, getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updateCimeBiancheName() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔄 Actualizando nombre de Monte Rosa a Cime Bianche en el calendario...\n');

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Leer calendario
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    
    // Buscar trabajos con "Monte Rosa" en el nombre de propiedad
    let updatedCount = 0;
    const updates: Array<{ range: string; values: string[][] }> = [];

    calendarData.slice(1).forEach((row, index) => {
      const propertyName = row[8]?.toString() || ''; // Columna I (índice 8) - Nome Proprietà
      
      if (propertyName.includes('Monte Rosa')) {
        const rowIndex = index + 2; // +2 porque índice 0 es header y Sheets empieza en 1
        const newName = propertyName.replace('Monte Rosa', 'Cime Bianche');
        
        updates.push({
          range: `Calendario!I${rowIndex}`,
          values: [[newName]],
        });
        updatedCount++;
        console.log(`   Fila ${rowIndex}: "${propertyName}" → "${newName}"`);
      }
    });

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: calendarSheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
      
      console.log(`\n✅ ${updatedCount} trabajo(s) actualizado(s)\n`);
    } else {
      console.log('⚠️  No se encontraron trabajos con "Monte Rosa"\n');
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updateCimeBiancheName();

