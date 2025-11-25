import { getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updatePropertyGuffo() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🏠 Actualizando propiedad IL GUFFO...\n');

    // Leer todas las propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    const headers = propertiesData[0];
    const rows = propertiesData.slice(1);

    // Buscar la propiedad "IL GUFFO" o "Chalet 1" del cliente Lika (ID 9)
    const propertyIndex = rows.findIndex(
      (row) => row[2] === 'Lika' && (row[4] === 'IL GUFFO' || row[4] === 'Chalet 1')
    );

    if (propertyIndex === -1) {
      console.log('❌ No se encontró la propiedad IL GUFFO/Chalet 1 de Lika');
      return;
    }
    const propertyRow = [...rows[propertyIndex]];

    // Actualizar los campos
    propertyRow[4] = 'IL GUFFO'; // Location
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
    console.log('   Location: IL GUFFO');
    console.log('   Servizi: Pulizia quotidiana tra le 6. Rifacimento letti e repassata giornaliera.');
    console.log('   Condizione: Solo se occupato con ospiti. Se vuoto non si fa nulla.');
    console.log('   Tempistiche: Tra le 6 (minimo)\n');
    console.log('📝 La propiedad está lista para usar en el calendario!\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updatePropertyGuffo();

