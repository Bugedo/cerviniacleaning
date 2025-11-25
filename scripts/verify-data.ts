import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function verifyData() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📊 Verificando datos guardados en Google Sheets:\n');

    // Clientes
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:B');
    console.log(`✅ CLIENTES (${clientsData.length - 1} registros):`);
    clientsData.slice(1).forEach((row) => {
      console.log(`   - ID ${row[0]}: ${row[1]}`);
    });

    // Propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    console.log(`\n✅ PROPIEDADES (${propertiesData.length - 1} registros):`);
    propertiesData.slice(1, 10).forEach((row) => {
      console.log(`   - ID ${row[0]}: ${row[4] || row[3]} (Cliente: ${row[2]})`);
    });
    if (propertiesData.length > 11) {
      console.log(`   ... y ${propertiesData.length - 11} más`);
    }

    // Empleados
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    console.log(`\n✅ EMPLEADOS (${resourcesData.length - 1} registros):`);
    resourcesData.slice(1).forEach((row) => {
      const name = row[1] || `Empleado ${row[0]}`;
      const role = row[2] || 'Operatore';
      console.log(`   - ID ${row[0]}: ${name} (${role})`);
    });

    // Verificar si Lika y sus propiedades están
    console.log('\n🔍 Verificando datos específicos:');
    const likaClient = clientsData.find((row) => row[1]?.toString().includes('Lika'));
    if (likaClient) {
      console.log(`   ✅ Cliente Lika encontrado (ID: ${likaClient[0]})`);
      const likaProperties = propertiesData.filter((row) => row[2]?.toString().includes('Lika'));
      console.log(`   ✅ Propiedades de Lika: ${likaProperties.length}`);
      likaProperties.forEach((row) => {
        console.log(`      - ${row[4] || row[3]}`);
      });
    } else {
      console.log('   ❌ Cliente Lika NO encontrado');
    }

    console.log('\n✅ Verificación completada!');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

verifyData();

