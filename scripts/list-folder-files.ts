import { getGoogleDriveClient } from '../lib/googleSheets';

async function listFolderFiles() {
  try {
    const FOLDER_ID = '13THeS4AnYGPf3RkLzFvDC-uWmPK6rai3';

    console.log('📁 Listando archivos en la carpeta compartida...\n');
    console.log(`Carpeta ID: ${FOLDER_ID}\n`);

    const drive = await getGoogleDriveClient();

    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(`✅ Encontrados ${response.data.files.length} archivos:\n`);

      response.data.files.forEach((file) => {
        const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
        console.log(`${isSheet ? '📊' : '📄'} ${file.name}`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Tipo: ${file.mimeType}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron archivos en la carpeta');
      console.log('   Esto puede significar:');
      console.log('   1. La carpeta está vacía');
      console.log('   2. La cuenta de servicio no tiene acceso');
      console.log('   3. Las APIs no están habilitadas\n');
    }
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    console.error('❌ Error:', err.message || error);
    console.error('   Código:', err.code);

    if (err.message?.includes('PERMISSION_DENIED') || err.message?.includes('SERVICE_DISABLED')) {
      console.log('\n💡 El problema es que las APIs de Google no están habilitadas.');
      console.log('   Compartir la carpeta NO habilita las APIs automáticamente.');
      console.log('   Necesitas habilitarlas en Google Cloud Console:\n');
      console.log('   1. Ve a: https://console.cloud.google.com/');
      console.log('   2. Selecciona el proyecto "cervinia-cleaning"');
      console.log('   3. Ve a "APIs & Services" > "Library"');
      console.log('   4. Busca y habilita:');
      console.log('      - Google Sheets API');
      console.log('      - Google Drive API');
      console.log('   5. Espera 2-3 minutos\n');
    }
  }
}

listFolderFiles();
