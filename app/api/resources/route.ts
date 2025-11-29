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
  resource7Id?: string;
  resource7Name?: string;
  resource8Id?: string;
  resource8Name?: string;
  resource9Id?: string;
  resource9Name?: string;
  resource10Id?: string;
  resource10Name?: string;
  resource11Id?: string;
  resource11Name?: string;
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

    // Leer horas manuales con detalles
    let manualHours: Array<{
      id: string;
      resourceId: string;
      date: string;
      hours: number;
      notes: string;
    }> = [];
    try {
      const manualHoursData = await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E');
      const manualHoursRows = manualHoursData.slice(1);
      manualHours = manualHoursRows
        .filter((row) => row[1] && row[2] && row[3])
        .map((row) => ({
          id: row[0] || '',
          resourceId: row[1] || '',
          date: row[2] || '',
          hours: parseFloat(row[3] || '0'),
          notes: row[4] || '',
        }));
    } catch {
      // Si la hoja no existe, continuar sin horas manuales
      console.log('Hoja "Ore Manuali" no existe aún');
    }

    // Identificar coordinadores que solo usan horas manuales
    // Incluye: Coordinatore, Assistente Coordinatore
    const coordinatorOnlyIds = new Set<string>();
    resources.forEach((resource) => {
      const role = (resource.role || '').toLowerCase();
      const fullName = `${resource.name} ${resource.surname}`.trim().toLowerCase();

      // Por rol
      if (
        role.includes('coordinatore') ||
        role.includes('coordinador') ||
        role.includes('assistente coordinatore') ||
        role.includes('asistente coordinador')
      ) {
        coordinatorOnlyIds.add(resource.id);
      }

      // Por nombre (por si acaso)
      if (
        ((fullName.includes('nicolas') || fullName.includes('nicolás')) &&
          fullName.includes('bugedo')) ||
        ((fullName.includes('gabriel') || fullName.includes('gabriele')) &&
          fullName.includes('gioria'))
      ) {
        coordinatorOnlyIds.add(resource.id);
      }
    });

    // Leer calendario para calcular horas y eventos (hasta columna AG para incluir 11 recursos)
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);

    const jobs: Job[] = calendarRows
      .filter((row) => row[5] === 'Lavoro') // Solo trabajos, no supervisiones
      .map((row) => {
        const job: Job = {
          id: row[0] || '',
          date: row[1] || '',
          startTime: row[3] || '',
          endTime: row[4] || '',
          propertyName: row[8] || '',
          client: row[9] || '',
          resource1Id: '',
          resource1Name: '',
          resource2Id: '',
          resource2Name: '',
          resource3Id: '',
          resource3Name: '',
          resource4Id: '',
          resource4Name: '',
          resource5Id: '',
          resource5Name: '',
          resource6Id: '',
          resource6Name: '',
        };

        // Agregar recursos 1-11 (empiezan en índice 11, después de clientId en índice 10)
        for (let i = 1; i <= 11; i++) {
          const idIndex = 10 + (i - 1) * 2 + 1; // 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31
          const nameIndex = 10 + (i - 1) * 2 + 2; // 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32
          const resourceId = (row[idIndex] || '') as string;
          const resourceName = (row[nameIndex] || '') as string;
          
          if (i === 1) {
            job.resource1Id = resourceId;
            job.resource1Name = resourceName;
          } else if (i === 2) {
            job.resource2Id = resourceId;
            job.resource2Name = resourceName;
          } else if (i === 3) {
            job.resource3Id = resourceId;
            job.resource3Name = resourceName;
          } else if (i === 4) {
            job.resource4Id = resourceId;
            job.resource4Name = resourceName;
          } else if (i === 5) {
            job.resource5Id = resourceId;
            job.resource5Name = resourceName;
          } else if (i === 6) {
            job.resource6Id = resourceId;
            job.resource6Name = resourceName;
          } else if (i === 7) {
            job.resource7Id = resourceId;
            job.resource7Name = resourceName;
          } else if (i === 8) {
            job.resource8Id = resourceId;
            job.resource8Name = resourceName;
          } else if (i === 9) {
            job.resource9Id = resourceId;
            job.resource9Name = resourceName;
          } else if (i === 10) {
            job.resource10Id = resourceId;
            job.resource10Name = resourceName;
          } else if (i === 11) {
            job.resource11Id = resourceId;
            job.resource11Name = resourceName;
          }
        }

        return job;
      });

    // Calcular horas y eventos para cada recurso
    // NOTA: Las horas de los eventos NO se suman automáticamente.
    // Solo se suman las horas manuales. Los eventos solo se muestran como referencia.
    const resourcesWithHours = resources.map((resource) => {
      const resourceJobs: Job[] = [];
      let totalHours = 0;
      const weeklyHours: Record<string, number> = {};
      const monthlyHours: Record<string, number> = {};

      // Buscar trabajos del calendario solo para referencia (NO se suman las horas)
      jobs.forEach((job) => {
        let isInJob = false;

        // Verificar si el recurso está en alguna posición (1-11)
        for (let i = 1; i <= 11; i++) {
          const resourceId = job[`resource${i}Id` as keyof Job] as string;
          if (resourceId === resource.id) {
            isInJob = true;
            break;
          }
        }

        if (isInJob) {
          // Filtrar por mes si se especifica
          if (!month || getMonthStart(job.date) === month) {
            // Agregar el job solo para referencia, pero NO sumar sus horas
            resourceJobs.push(job);
            // NO se suman las horas del evento: totalHours += hours;
          }
        }
      });

      // Agregar horas manuales (siempre, para todos)
      // Estas son las ÚNICAS horas que se suman
      const resourceManualHours = manualHours.filter(
        (mh) => mh.resourceId === resource.id && (!month || getMonthStart(mh.date) === month),
      );

      resourceManualHours.forEach((mh) => {
        totalHours += mh.hours;

        // Calcular horas por semana
        const weekStart = getWeekStart(new Date(mh.date));
        weeklyHours[weekStart] = (weeklyHours[weekStart] || 0) + mh.hours;

        // Calcular horas por mes
        const monthStart = getMonthStart(mh.date);
        monthlyHours[monthStart] = (monthlyHours[monthStart] || 0) + mh.hours;
      });

      return {
        ...resource,
        totalHours: totalHours.toFixed(2),
        jobsCount: resourceJobs.length,
        jobs: resourceJobs, // Eventos solo para referencia, no suman horas
        weeklyHours,
        monthlyHours,
        manualHours: resourceManualHours, // Incluir horas manuales con detalles
        isCoordinatorOnly: coordinatorOnlyIds.has(resource.id), // Indicar si es coordinador
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
