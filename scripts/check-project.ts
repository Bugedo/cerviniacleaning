import { readFileSync } from 'fs';
import path from 'path';

const credentialsPath = path.join(process.cwd(), 'cervinia-cleaning-2eef5bdde34b.json');
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));

console.log('📋 Información de la cuenta de servicio:');
console.log(`   Project ID: ${credentials.project_id}`);
console.log(`   Client Email: ${credentials.client_email}`);
console.log(`   Client ID: ${credentials.client_id}`);
console.log('\n');

console.log('🔍 El error menciona el proyecto: 61031577022');
console.log('   Este parece ser un Project Number, no el Project ID\n');

console.log('💡 Para solucionar esto:');
console.log('1. Ve a Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Selecciona el proyecto "cervinia-cleaning"');
console.log('3. Ve a "APIs & Services" > "Library"');
console.log('4. Busca y habilita:');
console.log('   - Google Sheets API');
console.log('   - Google Drive API');
console.log('5. Espera 2-3 minutos después de habilitar');
console.log('\n');
console.log('📁 También asegúrate de que la carpeta esté compartida con:');
console.log(`   ${credentials.client_email}`);
console.log('   Con permisos de "Editor"\n');

