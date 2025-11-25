import { getGoogleSheetsClient, getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function removeSupervisionEntry() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🗑️  Eliminando entrada de supervisión duplicada...\n');

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Leer calendario
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    
    // Encontrar la entrada de supervisión recién creada (última entrada con tipo "Supervisione" y coordinador ID 1)
    let supervisionIndex = -1;
    for (let i = calendarData.length - 1; i >= 1; i--) {
      const row = calendarData[i];
      if (row[5] === 'Supervisione' && row[21] === '1' && row[8]?.toString().includes('Monte Rosa')) {
        supervisionIndex = i;
        break;
      }
    }

    if (supervisionIndex === -1) {
      console.log('⚠️  No se encontró la entrada de supervisión a eliminar\n');
      return;
    }

    // Obtener sheetId de "Calendario"
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: calendarSheetId,
    });
    
    const calendarSheet = spreadsheet.data.sheets?.find(sheet => 
      sheet.properties?.title === 'Calendario'
    );
    
    if (!calendarSheet?.properties?.sheetId) {
      throw new Error('No se encontró la hoja "Calendario"');
    }
    
    const sheetId = calendarSheet.properties.sheetId;
    const rowToDelete = supervisionIndex + 1; // +1 porque las filas en Sheets empiezan en 1

    // Eliminar la fila
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: calendarSheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowToDelete - 1, // 0-indexed
                endIndex: rowToDelete, // No incluido
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Entrada de supervisión eliminada (fila ${rowToDelete})\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

removeSupervisionEntry();

