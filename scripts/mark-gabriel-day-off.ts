import { getGoogleSheetsClient, getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function markGabrielDayOff() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📅 Marcando día libre de Gabriel el viernes 21 de noviembre...\n');

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Leer calendario
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    
    // Buscar trabajo del viernes 21 de noviembre 2025
    const targetDate = '2025-11-21';
    let jobIndex = -1;

    calendarData.slice(1).forEach((row, index) => {
      const jobDate = row[1]?.toString() || '';
      if (jobDate === targetDate) {
        jobIndex = index + 1; // +1 porque índice 0 es header
      }
    });

    if (jobIndex === -1) {
      console.log('❌ No se encontró trabajo para el viernes 21 de noviembre\n');
      return;
    }

    const row = calendarData[jobIndex];
    const currentNotes = row[25]?.toString() || ''; // Columna 26 (índice 25) - Note
    
    // Agregar nota sobre el día libre de Gabriel
    const newNotes = currentNotes 
      ? `${currentNotes} | Gabriel (ID 2) giorno libero`
      : 'Gabriel (ID 2) giorno libero';

    // Actualizar las notas
    await sheets.spreadsheets.values.update({
      spreadsheetId: calendarSheetId,
      range: `Calendario!Z${jobIndex + 1}`, // +1 porque Sheets empieza en 1
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newNotes]],
      },
    });

    console.log('✅ Nota agregada al trabajo:');
    console.log(`   - Fecha: ${targetDate}`);
    console.log(`   - Propiedad: ${row[8] || 'N/A'}`);
    console.log(`   - Nota: "${newNotes}"\n`);
    console.log('📝 Gabriel (ID 2) no sumará las horas de este trabajo\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

markGabrielDayOff();

