import { getGoogleDriveClient } from '../lib/googleSheets';

async function checkFolderAccess() {
  try {
    const FOLDER_ID = '13THeS4AnYGPf3RkLzFvDC-uWmPK6rai3';
    
    console.log('🔍 Verificando acceso a la carpeta...\n');

    const drive = await getGoogleDriveClient();
    
    // Intentar obtener información de la carpeta
    const folder = await drive.files.get({
      fileId: FOLDER_ID,
      fields: 'id, name, mimeType, permissions',
    });

    console.log('✅ Acceso a la carpeta confirmado!');
    console.log(`   Nombre: ${folder.data.name}`);
    console.log(`   ID: ${folder.data.id}`);
    console.log(`   Tipo: ${folder.data.mimeType}\n`);

    // Listar archivos
    console.log('📋 Listando archivos...\n');
    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 100,
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(`✅ Encontrados ${response.data.files.length} archivos:\n`);
      response.data.files.forEach((file) => {
        const icon = file.mimeType === 'application/vnd.google-apps.spreadsheet' ? '📊' : '📄';
        console.log(`${icon} ${file.name} (${file.id})`);
      });
    } else {
      console.log('ℹ️  La carpeta está vacía o no tiene archivos visibles');
      console.log('   Esto es normal si aún no has creado los Google Sheets\n');
    }

    console.log('\n✅ Las APIs están funcionando correctamente!');
    console.log('   Puedes ejecutar: npm run create-sheets\n');

  } catch (error: unknown) {
    const err = error as { message?: string; code?: number; response?: { data?: unknown } };
    console.error('❌ Error:', err.message || error);
    
    if (err.response?.data) {
      console.error('Detalles:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkFolderAccess();

