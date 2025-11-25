import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function renameClientCervino() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔄 Renombrando cliente "Agenzia Cervino" a "Il Cervino"...\n');

    const clientsSheetId = config.sheets.clients;
    const sheets = await getGoogleSheetsClient();

    // Leer clientes
    const clientsData = await getSpreadsheetData(clientsSheetId, 'Clienti!A:B');
    
    // Encontrar el cliente "Agenzia Cervino"
    const cervinoIndex = clientsData.findIndex((row) => 
      row[1]?.toString().includes('Agenzia Cervino') || row[1]?.toString().includes('Cervino')
    );

    if (cervinoIndex === -1) {
      console.log('❌ No se encontró el cliente "Agenzia Cervino"');
      return;
    }

    const clientId = clientsData[cervinoIndex][0];
    console.log(`✅ Cliente encontrado: ID ${clientId} - ${clientsData[cervinoIndex][1]}`);

    // Actualizar nombre del cliente
    const updatedClientsData = [...clientsData];
    updatedClientsData[cervinoIndex][1] = 'Il Cervino';
    
    await updateSpreadsheetData(clientsSheetId, 'Clienti!A1', updatedClientsData);
    console.log(`✅ Nombre del cliente actualizado a "Il Cervino"\n`);

    // Actualizar nombre en todas las propiedades
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:Z');
    let updatedCount = 0;

    const updatedPropertiesData = propertiesData.map((row) => {
      // Columna 2 es "Nome Cliente"
      if (row[2]?.toString().includes('Agenzia Cervino') || row[2]?.toString().includes('Cervino')) {
        row[2] = 'Il Cervino';
        updatedCount++;
        return row;
      }
      return row;
    });

    if (updatedCount > 0) {
      await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', updatedPropertiesData);
      console.log(`✅ ${updatedCount} proprietà aggiornate con il nuovo nome cliente\n`);
    }

    console.log('✅ Cambio completato!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Cliente actualizado: ${clientId} - Il Cervino`);
    console.log(`   - Propiedades actualizadas: ${updatedCount}\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

renameClientCervino();

