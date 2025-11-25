import { getGoogleSheetsClient, getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function deleteRow23() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🗑️  Eliminando fila 23 (propiedad duplicada T335 ID 23)...\n');

    const clientsSheetId = config.sheets.clients;
    const sheets = await getGoogleSheetsClient();

    // Obtener el sheetId de "Proprietà"
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: clientsSheetId,
    });
    
    const proprietaSheet = spreadsheet.data.sheets?.find(sheet => 
      sheet.properties?.title === 'Proprietà'
    );
    
    if (!proprietaSheet?.properties?.sheetId) {
      throw new Error('No se encontró la hoja "Proprietà"');
    }
    
    const sheetId = proprietaSheet.properties.sheetId;
    console.log(`✅ SheetId de "Proprietà": ${sheetId}\n`);

    // Eliminar la fila 23 directamente usando batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: clientsSheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 22, // Fila 23 (0-indexed: 22)
                endIndex: 23, // Hasta la fila 24 (no incluida)
              },
            },
          },
        ],
      },
    });

    console.log('✅ Fila 23 eliminada correctamente!\n');

    // Verificar que se eliminó
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');
    const t335Count = propertiesData.slice(1).filter(row => 
      row[4]?.toString().includes('T335') || row[24]?.toString() === 'T335'
    ).length;

    console.log(`📊 Propiedades T335 restantes: ${t335Count}`);
    if (t335Count === 1) {
      console.log('✅ Perfecto! Solo queda una propiedad T335\n');
    } else {
      console.log(`⚠️  Todavía hay ${t335Count} propiedades T335\n`);
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    
    throw error;
  }
}

deleteRow23();

