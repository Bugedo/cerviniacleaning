import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function inspectClientsSheet() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    const clientsSheetId = config.sheets.clients;

    console.log('📊 Inspeccionando el sheet de Clientes...\n');
    console.log(`Sheet ID: ${clientsSheetId}\n`);

    // Listar todas las hojas del spreadsheet
    const { getGoogleSheetsClient } = await import('../lib/googleSheets');
    const sheets = await getGoogleSheetsClient();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: clientsSheetId,
    });

    console.log('📋 Hojas encontradas en el spreadsheet:');
    spreadsheet.data.sheets?.forEach((sheet) => {
      console.log(`   - ${sheet.properties?.title || 'Sin nombre'}`);
    });
    console.log('');

    // Intentar leer la hoja "Clienti"
    console.log('1. Leyendo hoja "Clienti":');
    try {
      const clientsData = await getSpreadsheetData(clientsSheetId, 'Clienti!A:B');
      console.log(`   Filas encontradas: ${clientsData.length}`);
      if (clientsData.length > 0) {
        console.log('   Primera fila (headers):', clientsData[0]);
        if (clientsData.length > 1) {
          console.log('   Segunda fila (primer dato):', clientsData[1]);
          console.log('   Últimas 3 filas:');
          clientsData.slice(-3).forEach((row, idx) => {
            console.log(`     Fila ${clientsData.length - 2 + idx}:`, row);
          });
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.log(`   ❌ Error: ${err.message || error}`);
    }
    console.log('');

    // Intentar leer la hoja "Proprietà"
    console.log('2. Leyendo hoja "Proprietà":');
    try {
      const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:Y');
      console.log(`   Filas encontradas: ${propertiesData.length}`);
      if (propertiesData.length > 0) {
        console.log('   Primera fila (headers):', propertiesData[0]?.slice(0, 5));
        if (propertiesData.length > 1) {
          console.log('   Segunda fila (primer dato):', propertiesData[1]?.slice(0, 5));
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.log(`   ❌ Error: ${err.message || error}`);
    }
    console.log('');

    // Intentar leer la primera hoja por defecto
    console.log('3. Leyendo primera hoja (por defecto):');
    try {
      const firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1';
      const firstSheetData = await getSpreadsheetData(clientsSheetId, `${firstSheetName}!A:Z`);
      console.log(`   Nombre: ${firstSheetName}`);
      console.log(`   Filas encontradas: ${firstSheetData.length}`);
      if (firstSheetData.length > 0) {
        console.log('   Primera fila:', firstSheetData[0]?.slice(0, 5));
        if (firstSheetData.length > 1) {
          console.log('   Segunda fila:', firstSheetData[1]?.slice(0, 5));
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.log(`   ❌ Error: ${err.message || error}`);
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

inspectClientsSheet();
