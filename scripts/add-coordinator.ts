import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addCoordinator() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('👤 Agregando coordinador (ID 1)...\n');

    const resourcesSheetId = config.sheets.resources;
    const resourcesData = await getSpreadsheetData(resourcesSheetId, 'Risorse!A:G');

    // Verificar si ya existe el ID 1
    const hasId1 = resourcesData.slice(1).some(row => row[0]?.toString() === '1');
    
    if (hasId1) {
      console.log('✅ El coordinador (ID 1) ya existe\n');
      return;
    }

    // Crear nueva lista con el coordinador al principio
    const updatedResourcesData: string[][] = [resourcesData[0]]; // Header
    
    // Agregar coordinador (ID 1)
    const coordinator = [
      '1',
      'Coordinatore', // Nome
      '', // Cognome (si existe)
      '', // Email (si existe)
      '', // Telefono (si existe)
      'Coordinatore', // Ruolo
      'Sì', // Attivo
    ];
    
    updatedResourcesData.push(coordinator);
    
    // Agregar el resto de empleados
    resourcesData.slice(1).forEach(row => {
      updatedResourcesData.push(row as string[]);
    });

    // Actualizar en Google Sheets
    await updateSpreadsheetData(resourcesSheetId, 'Risorse!A1', updatedResourcesData);

    console.log('✅ Coordinador agregado: ID 1 - Coordinatore');
    console.log(`\n📊 Total de empleados: ${updatedResourcesData.length - 1} (del 1 al 11)\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addCoordinator();

