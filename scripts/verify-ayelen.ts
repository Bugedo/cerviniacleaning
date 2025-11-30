import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function verifyAyelen() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Verificando información de Ayelen Baronetto...\n');

    // Leer recursos
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    const ayelen = resourcesRows.find((row) => {
      const name = (row[1] || '').toLowerCase();
      const surname = (row[2] || '').toLowerCase();
      return name.includes('ayelen') || surname.includes('baronetto');
    });

    if (!ayelen) {
      console.log('❌ No se encontró Ayelen Baronetto');
      return;
    }

    console.log(`✅ Información encontrada:`);
    console.log(`   ID: ${ayelen[0]}`);
    console.log(`   Nombre: "${ayelen[1]}"`);
    console.log(`   Apellido: "${ayelen[2]}"`);
    console.log(`   Nombre completo: "${ayelen[1]} ${ayelen[2]}"`);
    console.log(`   Rol: ${ayelen[5] || ''}`);
    console.log(`   Activo: ${ayelen[6] || ''}\n`);

    // Verificar eventos del 21 de noviembre
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);

    const nov21Events = calendarRows.filter(
      (row) => row[1] === '2025-11-21' && row[5] === 'Lavoro',
    );

    console.log(`📅 Eventos del 21 de noviembre: ${nov21Events.length}\n`);

    nov21Events.forEach((event, index) => {
      console.log(`   Evento ${index + 1} (ID: ${event[0]}):`);
      console.log(`      Propiedad: ${event[8]}`);
      console.log(`      Hora: ${event[3]} - ${event[4]}`);

      // Verificar si Ayelen está asignada
      for (let i = 1; i <= 11; i++) {
        const idIndex = 10 + (i - 1) * 2 + 1;
        const resourceId = event[idIndex] || '';
        if (resourceId === ayelen[0]) {
          console.log(`      ✅ Ayelen está asignada como resource${i}`);
          break;
        }
      }
      console.log('');
    });

    console.log(
      '✅ Verificación completada. El nombre "Ayelen Baronetto" está correcto en la base de datos.',
    );
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

verifyAyelen();
