import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function checkNovember21Event() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Verificando eventos del 21 de noviembre...\n');

    // Leer calendario
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);

    // Buscar eventos del 21 de noviembre de 2025
    const targetDate = '2025-11-21';
    const events = calendarRows.filter((row) => row[1] === targetDate);

    console.log(`📅 Eventos encontrados para ${targetDate}: ${events.length}\n`);

    if (events.length === 0) {
      console.log('⚠️  No se encontraron eventos para esa fecha');
      // Buscar eventos cercanos
      const allDates = calendarRows
        .map((row, index) => ({ date: row[1], index: index + 2 }))
        .filter((item) => item.date && item.date.includes('2025-11'))
        .slice(0, 10);

      console.log('\n📋 Fechas cercanas en noviembre 2025:');
      allDates.forEach((item) => {
        console.log(`   - ${item.date} (fila ${item.index})`);
      });
      return;
    }

    // Leer recursos para obtener nombres
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);
    const resourcesMap = new Map<string, { name: string; surname: string }>();
    resourcesRows.forEach((row) => {
      resourcesMap.set(row[0] || '', {
        name: row[1] || '',
        surname: row[2] || '',
      });
    });

    events.forEach((event, eventIndex) => {
      console.log(
        `\n📋 Evento ${eventIndex + 1} (ID: ${event[0]}, fila ${calendarRows.indexOf(event) + 2}):`,
      );
      console.log(`   Tipo: ${event[5] || ''}`);
      console.log(`   Propiedad: ${event[8] || ''}`);
      console.log(`   Cliente: ${event[9] || ''}`);
      console.log(`   Hora: ${event[3] || ''} - ${event[4] || ''}`);

      console.log(`\n   👥 Recursos asignados:`);

      // Verificar recursos 1-11
      let hasResources = false;
      for (let i = 1; i <= 11; i++) {
        const idIndex = 10 + (i - 1) * 2 + 1; // 11, 13, 15, etc.
        const nameIndex = 10 + (i - 1) * 2 + 2; // 12, 14, 16, etc.

        const resourceId = event[idIndex] || '';
        const resourceName = event[nameIndex] || '';

        if (resourceId || resourceName) {
          hasResources = true;
          const resource = resourcesMap.get(resourceId);
          const fullName = resource
            ? `${resource.name} ${resource.surname}`
            : resourceName || 'Desconocido';

          console.log(`      ${i}. ID: ${resourceId || 'N/A'} - ${fullName}`);

          // Verificar si es Aylen
          if (
            fullName.toLowerCase().includes('ayelen') ||
            fullName.toLowerCase().includes('aylen')
          ) {
            console.log(`         ⭐ ¡ES AYLEN!`);
          }
        }
      }

      if (!hasResources) {
        console.log(`      ⚠️  No hay recursos asignados a este evento`);
      }
    });

    // Buscar Aylen en todos los eventos
    console.log(`\n🔍 Buscando a Aylen Baronetto en todos los eventos...\n`);
    let aylenFound = false;
    calendarRows.forEach((row, index) => {
      for (let i = 1; i <= 11; i++) {
        const idIndex = 10 + (i - 1) * 2 + 1;
        const resourceId = row[idIndex] || '';
        if (resourceId) {
          const resource = resourcesMap.get(resourceId);
          if (
            resource &&
            (resource.name.toLowerCase().includes('ayelen') ||
              resource.name.toLowerCase().includes('aylen') ||
              resource.surname.toLowerCase().includes('baronetto'))
          ) {
            console.log(`✅ Aylen encontrada en evento:`);
            console.log(`   ID Evento: ${row[0]}`);
            console.log(`   Fecha: ${row[1]}`);
            console.log(`   Propiedad: ${row[8]}`);
            console.log(`   Posición: resource${i} (columna ${idIndex + 1})`);
            console.log(`   Fila en Sheets: ${index + 2}\n`);
            aylenFound = true;
          }
        }
      }
    });

    if (!aylenFound) {
      console.log('⚠️  Aylen no está asignada a ningún evento en el calendario');
    }

    // Verificar ID de Aylen
    console.log(`\n👤 Información de Aylen Baronetto:`);
    resourcesRows.forEach((row) => {
      const name = (row[1] || '').toLowerCase();
      const surname = (row[2] || '').toLowerCase();
      if (name.includes('ayelen') || name.includes('aylen') || surname.includes('baronetto')) {
        console.log(`   ID: ${row[0]}`);
        console.log(`   Nombre: ${row[1]} ${row[2]}`);
        console.log(`   Rol: ${row[5] || ''}`);
        console.log(`   Activo: ${row[6] || ''}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkNovember21Event();
