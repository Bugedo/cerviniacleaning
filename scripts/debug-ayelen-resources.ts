import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function debugAylenResources() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Debug: Verificando por qué Aylen no aparece en recursos...\n');

    // Leer recursos
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    const aylen = resourcesRows.find((row) => {
      const name = (row[1] || '').toLowerCase();
      const surname = (row[2] || '').toLowerCase();
      return name.includes('ayelen') || name.includes('aylen') || surname.includes('baronetto');
    });

    if (!aylen) {
      console.log('❌ No se encontró Aylen');
      return;
    }

    const aylenId = aylen[0] || '';
    console.log(`✅ Aylen encontrada:`);
    console.log(`   ID: ${aylenId}`);
    console.log(`   Nombre: ${aylen[1]} ${aylen[2]}`);
    console.log(`   Rol: ${aylen[5]}\n`);

    // Leer calendario
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);

    // Buscar evento del 21 de noviembre
    const targetDate = '2025-11-21';
    const event = calendarRows.find((row) => row[1] === targetDate && row[5] === 'Lavoro');

    if (!event) {
      console.log('❌ No se encontró evento de trabajo para esa fecha');
      return;
    }

    console.log(`📅 Evento encontrado:`);
    console.log(`   ID: ${event[0]}`);
    console.log(`   Fecha: ${event[1]}`);
    console.log(`   Tipo: ${event[5]}`);
    console.log(`   Propiedad: ${event[8]}`);
    console.log(`   Hora: ${event[3]} - ${event[4]}\n`);

    console.log(`🔍 Verificando recursos en el evento:\n`);
    
    // Verificar recursos 1-11 con los mismos índices que usa la API
    for (let i = 1; i <= 11; i++) {
      const idIndex = 10 + (i - 1) * 2 + 1; // 11, 13, 15, etc.
      const nameIndex = 10 + (i - 1) * 2 + 2; // 12, 14, 16, etc.
      
      const resourceId = event[idIndex] || '';
      const resourceName = event[nameIndex] || '';
      
      console.log(`   resource${i}:`);
      console.log(`      Índice ID: ${idIndex} (columna ${String.fromCharCode(65 + idIndex)})`);
      console.log(`      Índice Name: ${nameIndex} (columna ${String.fromCharCode(65 + nameIndex)})`);
      console.log(`      ID encontrado: "${resourceId}"`);
      console.log(`      Nombre encontrado: "${resourceName}"`);
      console.log(`      ¿Coincide con Aylen ID (${aylenId})? ${resourceId === aylenId ? '✅ SÍ' : '❌ NO'}`);
      
      if (resourceId === aylenId) {
        console.log(`      ⭐ ¡ESTE ES AYLEN EN POSICIÓN ${i}!\n`);
      } else if (resourceId) {
        console.log(`      (Es otro recurso)\n`);
      } else {
        console.log(`      (Vacío)\n`);
      }
    }

    // Simular la lógica de la API
    console.log(`\n🧪 Simulando lógica de la API:\n`);
    
    const job = {
      id: event[0] || '',
      date: event[1] || '',
      startTime: event[3] || '',
      endTime: event[4] || '',
      propertyName: event[8] || '',
      client: event[9] || '',
    };

    // Agregar recursos como lo hace la API
    for (let i = 1; i <= 11; i++) {
      const idIndex = 10 + (i - 1) * 2 + 1;
      const nameIndex = 10 + (i - 1) * 2 + 2;
      (job as Record<string, string>)[`resource${i}Id`] = event[idIndex] || '';
      (job as Record<string, string>)[`resource${i}Name`] = event[nameIndex] || '';
    }

    console.log(`   Job mapeado:`);
    console.log(`      resource1Id: "${(job as Record<string, string>).resource1Id}"`);
    console.log(`      resource1Name: "${(job as Record<string, string>).resource1Name}"`);
    
    // Verificar si Aylen está en el job
    let isInJob = false;
    for (let i = 1; i <= 11; i++) {
      const resourceId = (job as Record<string, string>)[`resource${i}Id`];
      if (resourceId === aylenId) {
        isInJob = true;
        console.log(`\n   ✅ Aylen encontrada en resource${i}Id`);
        break;
      }
    }

    if (!isInJob) {
      console.log(`\n   ❌ Aylen NO está en el job según la lógica de la API`);
      console.log(`   Esto significa que hay un problema con el mapeo o la comparación`);
    }

    // Calcular horas
    const startTime = event[3] || '';
    const endTime = event[4] || '';
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const diffMinutes = endMinutes - startMinutes;
      const hours = diffMinutes / 60;
      console.log(`\n   ⏱️  Horas del evento: ${hours}h (${startTime} - ${endTime})`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugAylenResources();

