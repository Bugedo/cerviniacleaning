import { NextResponse } from 'next/server';
import { getSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

interface Job {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  propertyName: string;
  client: string;
  resource1Id: string;
  resource1Name: string;
  resource2Id: string;
  resource2Name: string;
  resource3Id: string;
  resource3Name: string;
  resource4Id: string;
  resource4Name: string;
  resource5Id: string;
  resource5Name: string;
  resource6Id: string;
  resource6Name: string;
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM

    const config = getSheetsConfig();

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

    // Leer calendario para calcular horas y eventos
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z');
    const calendarRows = calendarData.slice(1);

    const jobs: Job[] = calendarRows
      .filter((row) => row[5] === 'Lavoro') // Solo trabajos, no supervisiones
      .map((row) => ({
        id: row[0] || '',
        date: row[1] || '',
        startTime: row[3] || '',
        endTime: row[4] || '',
        propertyName: row[8] || '',
        client: row[9] || '',
        resource1Id: row[10] || '',
        resource1Name: row[11] || '',
        resource2Id: row[12] || '',
        resource2Name: row[13] || '',
        resource3Id: row[14] || '',
        resource3Name: row[15] || '',
        resource4Id: row[16] || '',
        resource4Name: row[17] || '',
        resource5Id: row[18] || '',
        resource5Name: row[19] || '',
        resource6Id: row[20] || '',
        resource6Name: row[21] || '',
      }));

    // Calcular horas y eventos para cada recurso
    const resourcesWithHours = resources.map((resource) => {
      const resourceJobs: Job[] = [];
      let totalHours = 0;
      let weeklyHours: Record<string, number> = {};
      let monthlyHours: Record<string, number> = {};

      // Buscar todos los trabajos donde participa este recurso
      jobs.forEach((job) => {
        let isInJob = false;
        const hours = calculateHours(job.startTime, job.endTime);

        // Verificar si el recurso está en alguna posición (1-6)
        for (let i = 1; i <= 6; i++) {
          const resourceId = job[`resource${i}Id` as keyof Job] as string;
          if (resourceId === resource.id) {
            isInJob = true;
            break;
          }
        }

        if (isInJob) {
          // Filtrar por mes si se especifica
          if (!month || getMonthStart(job.date) === month) {
            resourceJobs.push(job);
            totalHours += hours;

            // Calcular horas por semana
            const weekStart = getWeekStart(new Date(job.date));
            weeklyHours[weekStart] = (weeklyHours[weekStart] || 0) + hours;

            // Calcular horas por mes
            const monthStart = getMonthStart(job.date);
            monthlyHours[monthStart] = (monthlyHours[monthStart] || 0) + hours;
          }
        }
      });

      return {
        ...resource,
        totalHours: totalHours.toFixed(2),
        jobsCount: resourceJobs.length,
        jobs: resourceJobs,
        weeklyHours,
        monthlyHours,
      };
    });

    return NextResponse.json({
      resources: resourcesWithHours,
      month: month || null,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener recursos';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

