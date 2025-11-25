import { NextResponse } from 'next/server';
import { getSpreadsheetData } from '@/lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM

    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

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

    // Leer calendario para calcular horas (hasta columna Z para incluir todos los campos)
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z');
    const calendarRows = calendarData.slice(1);

    // Calcular horas por recurso
    const resourcesWithHours = resources.map((resource) => {
      let totalHours = 0;
      const jobs: unknown[] = [];

      calendarRows.forEach((row) => {
        const jobDate = row[1] || '';
        // Leer todos los recursos (hasta 6): columnas 10, 12, 14, 16, 18, 20 (índices 9, 11, 13, 15, 17, 19)
        const resource1Id = row[10] || '';
        const resource2Id = row[12] || '';
        const resource3Id = row[14] || '';
        const resource4Id = row[16] || '';
        const resource5Id = row[18] || '';
        const resource6Id = row[20] || '';
        const coordinatorId = row[21] || ''; // Columna 22 (índice 21)
        const hoursWorked = parseFloat(row[23] || '0'); // Columna 24 (índice 23) - Ore Lavorate
        const type = row[5] || '';

        // Filtrar por mes si se especifica
        if (month && jobDate) {
          const jobMonth = jobDate.substring(0, 7); // YYYY-MM
          if (jobMonth !== month) return;
        }

        // Verificar si el recurso está asignado a este trabajo (cualquiera de los 6 recursos o coordinador)
        const isAssigned = 
          resource1Id === resource.id ||
          resource2Id === resource.id ||
          resource3Id === resource.id ||
          resource4Id === resource.id ||
          resource5Id === resource.id ||
          resource6Id === resource.id ||
          (coordinatorId === resource.id && type === 'Supervisione');

        if (isAssigned) {
          totalHours += hoursWorked;
          jobs.push({
            date: jobDate,
            hours: hoursWorked,
            type: type,
          });
        }
      });

      return {
        ...resource,
        totalHours: totalHours.toFixed(2),
        jobsCount: jobs.length,
        jobs: month ? jobs : [], // Solo incluir jobs si se filtra por mes
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

