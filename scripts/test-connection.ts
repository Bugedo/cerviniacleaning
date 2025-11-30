import { getGoogleSheetsClient, getGoogleDriveClient } from '../lib/googleSheets';

async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Google APIs...\n');

    // Test 1: Google Sheets API
    console.log('1. Probando Google Sheets API...');
    const sheets = await getGoogleSheetsClient();
    console.log('   ✅ Cliente de Sheets creado correctamente');

    // Test 2: Google Drive API
    console.log('2. Probando Google Drive API...');
    const drive = await getGoogleDriveClient();
    console.log('   ✅ Cliente de Drive creado correctamente');

    // Test 3: Intentar crear un spreadsheet de prueba
    console.log('3. Intentando crear un spreadsheet de prueba...');
    const testSpreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Test Connection - Cervinia Cleaning',
        },
      },
    });

    if (testSpreadsheet.data.spreadsheetId) {
      console.log(`   ✅ Spreadsheet creado: ${testSpreadsheet.data.spreadsheetId}`);

      // Limpiar: eliminar el spreadsheet de prueba
      const driveClient = await getGoogleDriveClient();
      await driveClient.files.delete({
        fileId: testSpreadsheet.data.spreadsheetId,
      });
      console.log('   ✅ Spreadsheet de prueba eliminado');
    }

    console.log('\n✅ Todas las pruebas pasaron! Las APIs están funcionando correctamente.');
  } catch (error: any) {
    console.error('\n❌ Error en la conexión:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);

    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('1. Verifica que las APIs estén habilitadas en Google Cloud Console');
      console.log('2. Espera 2-3 minutos después de habilitar las APIs');
      console.log('3. Verifica que la cuenta de servicio tenga permisos en la carpeta');
      console.log(
        '4. Comparte la carpeta con: cervinia-cleaning@cervinia-cleaning.iam.gserviceaccount.com',
      );
    }
  }
}

testConnection();
