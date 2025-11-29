import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function findGabriel() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Buscando Gabriel Gioria...\n');

    // Leer recursos
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    console.log('📋 Todos los recursos:\n');
    resourcesRows.forEach((row, index) => {
      const id = row[0] || '';
      const name = row[1] || '';
      const surname = row[2] || '';
      const role = row[5] || '';
      console.log(`   [${id}] ${name} ${surname} - Rol: "${role}" (fila ${index + 2})`);
    });

    // Buscar variaciones de Gabriel
    console.log('\n🔍 Buscando variaciones de "Gabriel"...\n');
    resourcesRows.forEach((row, index) => {
      const name = (row[1] || '').toLowerCase();
      const surname = (row[2] || '').toLowerCase();
      const fullName = `${row[1] || ''} ${row[2] || ''}`.toLowerCase();
      
      if (
        name.includes('gabriel') || 
        name.includes('gabriele') ||
        surname.includes('gioria') ||
        fullName.includes('gabriel') ||
        fullName.includes('gioria')
      ) {
        console.log(`✅ Posible coincidencia:`);
        console.log(`   ID: ${row[0]}`);
        console.log(`   Nombre: ${row[1]} ${row[2]}`);
        console.log(`   Rol: "${row[5] || ''}"`);
        console.log(`   Fila: ${index + 2}\n`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

findGabriel();

