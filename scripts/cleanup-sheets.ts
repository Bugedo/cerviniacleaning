import { getGoogleSheetsClient } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function cleanupSheets() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🧹 Limpiando hojas vacías...\n');

    const sheets = await getGoogleSheetsClient();

    // Limpiar sheet de Clientes
    console.log('1. Limpiando sheet de Clientes...');
    const clientsSpreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.sheets.clients,
    });

    const clientsSheetsToDelete: number[] = [];
    clientsSpreadsheet.data.sheets?.forEach((sheet, index) => {
      const title = sheet.properties?.title || '';
      if (title === 'Hoja 1' || title === 'Sheet1') {
        clientsSheetsToDelete.push(sheet.properties?.sheetId || 0);
        console.log(`   🗑️  Eliminando hoja vacía: "${title}"`);
      }
    });

    if (clientsSheetsToDelete.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.sheets.clients,
        requestBody: {
          requests: clientsSheetsToDelete.map((sheetId) => ({
            deleteSheet: {
              sheetId,
            },
          })),
        },
      });
      console.log('   ✅ Hojas vacías eliminadas\n');
    } else {
      console.log('   ℹ️  No hay hojas vacías para eliminar\n');
    }

    // Limpiar otros sheets también
    const otherSheets = [
      { name: 'Calendario', id: config.sheets.calendar },
      { name: 'Risorse', id: config.sheets.resources },
      { name: 'Fatturazione', id: config.sheets.billing },
    ];

    for (const sheetInfo of otherSheets) {
      console.log(`2. Verificando sheet de ${sheetInfo.name}...`);
      try {
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: sheetInfo.id,
        });

        const sheetsToDelete: number[] = [];
        spreadsheet.data.sheets?.forEach((sheet) => {
          const title = sheet.properties?.title || '';
          if (title === 'Hoja 1' || title === 'Sheet1') {
            sheetsToDelete.push(sheet.properties?.sheetId || 0);
            console.log(`   🗑️  Eliminando hoja vacía: "${title}"`);
          }
        });

        if (sheetsToDelete.length > 0) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetInfo.id,
            requestBody: {
              requests: sheetsToDelete.map((sheetId) => ({
                deleteSheet: {
                  sheetId,
                },
              })),
            },
          });
          console.log('   ✅ Hojas vacías eliminadas\n');
        } else {
          console.log('   ℹ️  No hay hojas vacías\n');
        }
      } catch (error) {
        console.log(`   ⚠️  Error al verificar: ${error}\n`);
      }
    }

    console.log('✅ Limpieza completada!');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

cleanupSheets();

