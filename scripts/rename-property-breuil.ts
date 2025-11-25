import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function renamePropertyBreuil() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔄 Renombrando propiedad "APT 5P BREUIL" a "Breuil q456"...\n');

    const clientsSheetId = config.sheets.clients;
    const sheets = await getGoogleSheetsClient();

    // Leer propiedades
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:Z');
    
    // Encontrar la propiedad "APT 5P Breuil" (campo Location está en la columna 4, índice 4)
    const breuilIndex = propertiesData.findIndex((row) => 
      row[4]?.toString().includes('APT 5P') || row[4]?.toString().toLowerCase().includes('breuil')
    );

    if (breuilIndex === -1) {
      console.log('❌ No se encontró la propiedad "APT 5P BREUIL"');
      return;
    }

    const propertyId = propertiesData[breuilIndex][0];
    const oldLocation = propertiesData[breuilIndex][4];
    console.log(`✅ Propiedad encontrada: ID ${propertyId} - ${oldLocation}`);

    // Actualizar Location (columna 4, índice 4)
    const updatedPropertiesData = [...propertiesData];
    updatedPropertiesData[breuilIndex][4] = 'Breuil q456';
    
    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', updatedPropertiesData);
    console.log(`✅ Location actualizada: "${oldLocation}" → "Breuil q456"\n`);

    console.log('✅ Cambio completado!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Propiedad ID: ${propertyId}`);
    console.log(`   - Location actualizada: "Breuil q456"\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

renamePropertyBreuil();

