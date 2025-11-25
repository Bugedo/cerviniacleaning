import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function checkSheetsStatus() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📊 Verificando estado de los Google Sheets...\n');

    // Verificar Clientes
    console.log('1. 📋 Sheet de Clientes:');
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:B');
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    console.log(`   ✅ Clientes: ${clientsData.length - 1} registros`);
    console.log(`   ✅ Propiedades: ${propertiesData.length - 1} registros\n`);

    // Verificar Calendario
    console.log('2. 📅 Sheet de Calendario:');
    try {
      const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:M');
      console.log(`   ${calendarData.length > 1 ? '✅' : '⚠️ '} Registros: ${calendarData.length - 1}`);
      if (calendarData.length === 1) {
        console.log('   ⚠️  Solo tiene headers, necesita datos\n');
      }
    } catch (error) {
      console.log('   ❌ Error al leer o no existe la hoja "Calendario"\n');
    }

    // Verificar Risorse
    console.log('3. 👥 Sheet de Risorse:');
    try {
      const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
      console.log(`   ${resourcesData.length > 1 ? '✅' : '⚠️ '} Registros: ${resourcesData.length - 1}`);
      if (resourcesData.length === 1) {
        console.log('   ⚠️  Solo tiene headers, necesita datos\n');
      }
    } catch (error) {
      console.log('   ❌ Error al leer o no existe la hoja "Risorse"\n');
    }

    // Verificar Fatturazione
    console.log('4. 💰 Sheet de Fatturazione:');
    try {
      const billingData = await getSpreadsheetData(config.sheets.billing, 'Fatturazione!A:G');
      console.log(`   ${billingData.length > 1 ? '✅' : '⚠️ '} Registros: ${billingData.length - 1}`);
      if (billingData.length === 1) {
        console.log('   ⚠️  Solo tiene headers, necesita datos\n');
      }
    } catch (error) {
      console.log('   ❌ Error al leer o no existe la hoja "Fatturazione"\n');
    }

    console.log('\n✅ Verificación completada!');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

checkSheetsStatus();

