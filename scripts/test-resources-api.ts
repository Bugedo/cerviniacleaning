import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

// Simular la lógica exacta de la API
function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  const diffMinutes = endMinutes - startMinutes;
  return diffMinutes / 60;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getMonthStart(date: string): string {
  return date.substring(0, 7); // YYYY-MM
}

async function testResourcesAPI() {
  try {
    const config = getSheetsConfig();
    const month = '2025-11'; // Noviembre 2025

    console.log(`🧪 Probando API de recursos para mes: ${month}\n`);

    // Leer recursos
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    const resources = resourcesRows.map((row) => ({
      id: row[0] || '',
      name: row[1] || '',
      surname: row[2] || '',
      email: row[3] || '',
      phone: row[4] || '',
      role: row[5] || '',
      active: row[6] || '',
    }));

    const aylen = resources.find(r => r.id === '3');
    if (!aylen) {
      console.log('❌ No se encontró Aylen');
      return;
    }

    console.log(`✅ Aylen: ${aylen.name} ${aylen.surname} (ID: ${aylen.id})\n`);

    // Leer calendario
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);

    const jobs = calendarRows
      .filter((row) => row[5] === 'Lavoro')
      .map((row) => {
        const job: Record<string, string> = {
          id: row[0] || '',
          date: row[1] || '',
          startTime: row[3] || '',
          endTime: row[4] || '',
          propertyName: row[8] || '',
          client: row[9] || '',
        };

        // Agregar recursos 1-11
        for (let i = 1; i <= 11; i++) {
          const idIndex = 10 + (i - 1) * 2 + 1;
          const nameIndex = 10 + (i - 1) * 2 + 2;
          job[`resource${i}Id`] = row[idIndex] || '';
          job[`resource${i}Name`] = row[nameIndex] || '';
        }

        return job;
      });

    console.log(`📅 Total de trabajos: ${jobs.length}\n`);

    // Buscar trabajos de Aylen
    const aylenJobs: Array<{ job: Record<string, string>; hours: number; month: string }> = [];

    jobs.forEach((job) => {
      let isInJob = false;
      const hours = calculateHours(job.startTime, job.endTime);

      // Verificar si Aylen está en alguna posición (1-11)
      for (let i = 1; i <= 11; i++) {
        const resourceId = job[`resource${i}Id`] as string;
        if (resourceId === aylen.id) {
          isInJob = true;
          break;
        }
      }

      if (isInJob) {
        const jobMonth = getMonthStart(job.date);
        const shouldInclude = !month || jobMonth === month;
        
        console.log(`   📋 Evento ${job.id} (${job.date}):`);
        console.log(`      Horas: ${hours}h`);
        console.log(`      Mes del evento: ${jobMonth}`);
        console.log(`      Mes filtro: ${month || 'todos'}`);
        console.log(`      ¿Incluir? ${shouldInclude ? '✅ SÍ' : '❌ NO'}`);
        
        if (shouldInclude) {
          aylenJobs.push({
            job,
            hours,
            month: jobMonth,
          });
        }
        console.log('');
      }
    });

    console.log(`\n📊 Resumen para Aylen:`);
    console.log(`   Total de eventos encontrados: ${aylenJobs.length}`);
    
    let totalHours = 0;
    const weeklyHours: Record<string, number> = {};
    const monthlyHours: Record<string, number> = {};

    aylenJobs.forEach(({ job, hours, month: jobMonth }) => {
      totalHours += hours;
      
      const weekStart = getWeekStart(new Date(job.date));
      weeklyHours[weekStart] = (weeklyHours[weekStart] || 0) + hours;
      
      monthlyHours[jobMonth] = (monthlyHours[jobMonth] || 0) + hours;
    });

    console.log(`   Total de horas: ${totalHours.toFixed(2)}h`);
    console.log(`\n   Horas por semana:`);
    Object.entries(weeklyHours)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([week, hours]) => {
        console.log(`      ${week}: ${hours.toFixed(2)}h`);
      });
    
    console.log(`\n   Horas por mes:`);
    Object.entries(monthlyHours)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, hours]) => {
        console.log(`      ${month}: ${hours.toFixed(2)}h`);
      });

    // Verificar específicamente el 21 de noviembre
    const nov21Job = aylenJobs.find(({ job }) => job.date === '2025-11-21');
    if (nov21Job) {
      console.log(`\n   ✅ Evento del 21 de noviembre INCLUIDO:`);
      console.log(`      Horas: ${nov21Job.hours}h`);
      console.log(`      Propiedad: ${nov21Job.job.propertyName}`);
    } else {
      console.log(`\n   ❌ Evento del 21 de noviembre NO INCLUIDO`);
      console.log(`      Esto indica un problema con el filtro o el mapeo`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testResourcesAPI();

