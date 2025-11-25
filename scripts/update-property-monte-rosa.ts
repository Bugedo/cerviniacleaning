import { getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updatePropertyMonteRosa() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🏠 Actualizando propiedad Monte Rosa (Cime Bianche)...\n');

    // Leer todas las propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    const headers = propertiesData[0];
    const rows = propertiesData.slice(1);

    // Buscar la propiedad "Chalet 3A" del cliente Lika
    const propertyIndex = rows.findIndex(
      (row) => row[2] === 'Lika' && (row[4] === 'Monte Rosa' || row[4] === 'Chalet 3A')
    );

    if (propertyIndex === -1) {
      console.log('❌ No se encontró la propiedad Monte Rosa/Chalet 3A de Lika');
      return;
    }

    const propertyRow = [...rows[propertyIndex]];

    // Actualizar los campos
    propertyRow[4] = 'Monte Rosa'; // Location
    propertyRow[5] = 'Quadrilocale'; // Tipologia Locale
    propertyRow[13] = 'Pulizia profonda con 4 risorse. Pulizia repasso con 2 risorse. Tipo di pulizia da definire in base al giorno.'; // Servizi e Dettagli
    propertyRow[16] = 'Cime Bianche - Subdivisione Monte Rosa. Pulizia profonda: 4 risorse. Repasso: 2 risorse.'; // Note Speciali
    propertyRow[17] = 'Profonda: 4 risorse | Repasso: 2 risorse'; // Tempistiche

    // Actualizar la fila en el array
    rows[propertyIndex] = propertyRow;

    // Reconstruir todos los datos con headers
    const updatedData = [headers, ...rows];

    // Escribir todos los datos actualizados
    await updateSpreadsheetData(config.sheets.clients, 'Proprietà!A1', updatedData);

    console.log('✅ Propiedad actualizada:');
    console.log('   Location: Monte Rosa');
    console.log('   Tipologia: Quadrilocale');
    console.log('   Pulizia Profonda: 4 risorse');
    console.log('   Pulizia Repasso: 2 risorse');
    console.log('   Note: Cime Bianche - Subdivisione\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updatePropertyMonteRosa();

