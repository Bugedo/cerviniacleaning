import { getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updatePropertiesMontBlancBreithron() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🏠 Actualizando propiedades Mont Blanc y Breithron...\n');

    // Leer todas las propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    const headers = propertiesData[0];
    const rows = propertiesData.slice(1);

    // Buscar y actualizar Mont Blanc (Chalet 3B)
    const montBlancIndex = rows.findIndex(
      (row) => row[2] === 'Lika' && (row[4] === 'Mont Blanc' || row[4] === 'Chalet 3B')
    );

    if (montBlancIndex !== -1) {
      const montBlancRow = [...rows[montBlancIndex]];
      montBlancRow[4] = 'Mont Blanc';
      montBlancRow[5] = 'Appartamento';
      montBlancRow[13] = 'Pulizia profonda con 2 risorse. Pulizia repasso con 2 risorse. Tipo di pulizia da definire in base al giorno.';
      montBlancRow[16] = 'Cime Bianche - Subdivisione Mont Blanc. Pulizia profonda: 2 risorse. Repasso: 2 risorse.';
      montBlancRow[17] = 'Profonda: 2 risorse | Repasso: 2 risorse';
      rows[montBlancIndex] = montBlancRow;
      console.log('✅ Mont Blanc actualizado');
    }

    // Buscar y actualizar Breithron (Chalet 3C)
    const breithronIndex = rows.findIndex(
      (row) => row[2] === 'Lika' && (row[4] === 'Breithron' || row[4] === 'Chalet 3C')
    );

    if (breithronIndex !== -1) {
      const breithronRow = [...rows[breithronIndex]];
      breithronRow[4] = 'Breithron';
      breithronRow[5] = 'Appartamento';
      breithronRow[13] = 'Pulizia profonda con 2 risorse. Pulizia repasso con 2 risorse. Tipo di pulizia da definire in base al giorno.';
      breithronRow[16] = 'Cime Bianche - Subdivisione Breithron. Pulizia profonda: 2 risorse. Repasso: 2 risorse.';
      breithronRow[17] = 'Profonda: 2 risorse | Repasso: 2 risorse';
      rows[breithronIndex] = breithronRow;
      console.log('✅ Breithron actualizado');
    }

    // Reconstruir todos los datos con headers
    const updatedData = [headers, ...rows];

    // Escribir todos los datos actualizados
    await updateSpreadsheetData(config.sheets.clients, 'Proprietà!A1', updatedData);

    console.log('\n✅ Propiedades actualizadas:');
    console.log('   - Mont Blanc: Profonda/Repasso con 2 risorse');
    console.log('   - Breithron: Profonda/Repasso con 2 risorse\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updatePropertiesMontBlancBreithron();

