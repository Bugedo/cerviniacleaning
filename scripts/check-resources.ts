import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function checkResources() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('👥 Verificando recursos/empleados...\n');

    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');

    console.log(`📊 Total de registros: ${resourcesData.length - 1} (sin contar header)\n`);
    
    console.log('📋 Empleados actuales:');
    resourcesData.slice(1).forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const name = row[1]?.toString() || '';
      const role = row[5]?.toString() || '';
      console.log(`   ${index + 1}. ID ${id}: ${name || `Empleado ${id}`} (${role || 'Operatore'})`);
    });

    // Verificar si falta el ID 1
    const ids = resourcesData.slice(1).map(row => parseInt(row[0]?.toString() || '0'));
    const hasId1 = ids.includes(1);
    
    console.log(`\n🔍 Verificación:`);
    console.log(`   - ID mínimo: ${Math.min(...ids)}`);
    console.log(`   - ID máximo: ${Math.max(...ids)}`);
    console.log(`   - ¿Falta ID 1?: ${!hasId1 ? 'SÍ ❌' : 'NO ✅'}`);
    
    if (!hasId1) {
      console.log('\n⚠️  Falta el coordinador (ID 1)\n');
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

checkResources();

