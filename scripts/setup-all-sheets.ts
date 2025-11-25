import { getGoogleSheetsClient, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function setupAllSheets() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📊 Configurando todos los Google Sheets...\n');

    const sheets = await getGoogleSheetsClient();

    // 1. Calendario - Crear hoja si no existe
    console.log('1. 📅 Configurando Calendario...');
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.sheets.calendar,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: 'Calendario' },
              },
            },
          ],
        },
      });
      console.log('   ✅ Hoja "Calendario" creada');
    } catch {
      console.log('   ℹ️  Hoja "Calendario" ya existe');
    }

    const calendarHeaders = [
      'Data',
      'Giorno',
      'ID Proprietà',
      'Nome Proprietà',
      'Cliente',
      'ID Risorsa 1',
      'Nome Risorsa 1',
      'ID Risorsa 2',
      'Nome Risorsa 2',
      'Ora Inizio',
      'Ora Fine',
      'Stato',
      'Note',
    ];

    await updateSpreadsheetData(config.sheets.calendar, 'Calendario!A1', [calendarHeaders]);
    console.log('   ✅ Headers de Calendario configurados\n');

    // 2. Risorse - Crear hoja si no existe
    console.log('2. 👥 Configurando Risorse...');
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.sheets.resources,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: 'Risorse' },
              },
            },
          ],
        },
      });
      console.log('   ✅ Hoja "Risorse" creada');
    } catch {
      console.log('   ℹ️  Hoja "Risorse" ya existe');
    }

    const resourcesHeaders = [
      'ID',
      'Nome',
      'Cognome',
      'Email',
      'Telefono',
      'Ruolo',
      'Attivo',
    ];

    await updateSpreadsheetData(config.sheets.resources, 'Risorse!A1', [resourcesHeaders]);
    console.log('   ✅ Headers de Risorse configurados\n');

    // 3. Fatturazione - Crear hoja si no existe
    console.log('3. 💰 Configurando Fatturazione...');
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.sheets.billing,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: 'Fatturazione' },
              },
            },
          ],
        },
      });
      console.log('   ✅ Hoja "Fatturazione" creada');
    } catch {
      console.log('   ℹ️  Hoja "Fatturazione" ya existe');
    }

    const billingHeaders = [
      'ID',
      'Data',
      'Cliente',
      'Proprietà',
      'Importo',
      'Stato',
      'Note',
    ];

    await updateSpreadsheetData(config.sheets.billing, 'Fatturazione!A1', [billingHeaders]);
    console.log('   ✅ Headers de Fatturazione configurados\n');

    console.log('✅ Todos los Google Sheets están configurados y listos para usar!');
    console.log('\n📝 Próximos pasos:');
    console.log('   - Agregar los 11 empleados en el sheet de Risorse');
    console.log('   - Los datos de Clientes ya están completos');
    console.log('   - Calendario y Fatturazione están listos para usar\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

setupAllSheets();

