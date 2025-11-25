import { getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updatePropertySnowStorm() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🏠 Actualizando propiedad Snow Storm...\n');

    // Leer todas las propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    const headers = propertiesData[0];
    const rows = propertiesData.slice(1);

    // Buscar la propiedad "Chalet 2" del cliente Lika
    const propertyIndex = rows.findIndex(
      (row) => row[2] === 'Lika' && (row[4] === 'Snow Storm' || row[4] === 'Chalet 2')
    );

    if (propertyIndex === -1) {
      console.log('❌ No se encontró la propiedad Snow Storm/Chalet 2 de Lika');
      return;
    }

    const propertyRow = [...rows[propertyIndex]];

    // Actualizar los campos (igual que IL GUFFO)
    propertyRow[4] = 'Snow Storm'; // Location
    propertyRow[13] = 'Pulizia quotidiana con 6 risorse. Rifacimento letti e repassata giornaliera. Solo se occupato con ospiti. Se vuoto non si fa nulla.'; // Servizi e Dettagli
    propertyRow[16] = 'Pulizia con 6 risorse. Solo se occupato. Letti e repassata giornaliera. Ora da definire.'; // Note Speciali
    propertyRow[17] = 'Con 6 risorse (ora da definire)'; // Tempistiche

    // Actualizar la fila en el array
    rows[propertyIndex] = propertyRow;

    // Reconstruir todos los datos con headers
    const updatedData = [headers, ...rows];

    // Escribir todos los datos actualizados
    await updateSpreadsheetData(config.sheets.clients, 'Proprietà!A1', updatedData);

    console.log('✅ Propiedad actualizada:');
    console.log('   Location: Snow Storm');
    console.log('   Servizi: Pulizia quotidiana con 6 risorse. Rifacimento letti e repassata giornaliera.');
    console.log('   Condizione: Solo se occupato con ospiti. Se vuoto non si fa nulla.');
    console.log('   Tempistiche: Con 6 risorse (ora da definire)\n');
    console.log('📝 La propiedad está lista para usar en el calendario!\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updatePropertySnowStorm();

