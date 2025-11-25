import { getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addCommentsField() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('💬 Agregando campo Commenti a las propiedades...\n');

    // Leer propiedades actuales
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    const headers = propertiesData[0];
    const rows = propertiesData.slice(1);

    // Verificar si ya existe el campo Commenti
    if (headers.includes('Commenti')) {
      console.log('ℹ️  El campo Commenti ya existe');
      return;
    }

    // Agregar el campo Commenti al final
    const newHeaders = [...headers, 'Commenti'];
    
    // Agregar columna vacía a todas las filas
    const newRows = rows.map((row) => [...row, '']);

    // Reconstruir datos
    const updatedData = [newHeaders, ...newRows];

    // Escribir datos actualizados
    await updateSpreadsheetData(config.sheets.clients, 'Proprietà!A1', updatedData);

    console.log('✅ Campo "Commenti" agregado a todas las propiedades!');
    console.log('\n📝 Ahora puedes agregar comentarios desde:');
    console.log('   - Google Sheets directamente');
    console.log('   - La app (cuando implementemos la funcionalidad)');
    console.log('   - Scripts desde consola\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addCommentsField();

