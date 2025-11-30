import { NextResponse } from 'next/server';
import {
  getSpreadsheetData,
  appendSpreadsheetData,
  getGoogleSheetsClient,
} from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

interface ManualHour {
  id: string;
  resourceId: string;
  date: string;
  hours: number;
  notes?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const month = searchParams.get('month'); // YYYY-MM

    const config = getSheetsConfig();

    // Intentar leer de la hoja "Ore Manuali" en el spreadsheet de recursos
    try {
      const manualHoursData = await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E');
      const rows = manualHoursData.slice(1); // Excluir header

      // Función para convertir HH:MM a horas decimales
      const timeToDecimal = (timeStr: string): number => {
        if (!timeStr || typeof timeStr !== 'string') {
          // Si es un número (formato antiguo), devolverlo como está
          const num = parseFloat(timeStr);
          if (!isNaN(num)) return num;
          return 0;
        }
        if (!timeStr.includes(':')) {
          // Si no tiene ':', intentar parsear como número
          const num = parseFloat(timeStr);
          return isNaN(num) ? 0 : num;
        }
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + minutes / 60;
      };

      let manualHours: ManualHour[] = rows
        .filter((row) => row[0] && row[1] && row[2] && row[3]) // Filtrar filas vacías
        .map((row) => {
          const hoursValue = row[3] || '0';
          // Convertir HH:MM o número a decimal para cálculos
          const decimalHours = timeToDecimal(hoursValue);
          return {
            id: row[0] || '',
            resourceId: row[1] || '',
            date: row[2] || '',
            hours: decimalHours,
            notes: row[4] || '',
          };
        });

      // Filtrar por resourceId si se proporciona
      if (resourceId) {
        manualHours = manualHours.filter((mh) => mh.resourceId === resourceId);
      }

      // Filtrar por mes si se proporciona
      if (month) {
        manualHours = manualHours.filter((mh) => mh.date.startsWith(month));
      }

      return NextResponse.json({ manualHours });
    } catch {
      // Si la hoja no existe, retornar vacío
      console.log('Hoja "Ore Manuali" no existe aún, retornando vacío');
      return NextResponse.json({ manualHours: [] });
    }
  } catch (error) {
    console.error('Error fetching manual hours:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener horas manuales';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resourceId, date, hours, notes } = body;

    if (!resourceId || !date || hours === undefined) {
      return NextResponse.json(
        { error: 'resourceId, date y hours son requeridos' },
        { status: 400 },
      );
    }

    // Validar y normalizar el formato de horas
    // Acepta tanto HH:MM como números decimales (para compatibilidad)
    let hoursValue: string;
    if (typeof hours === 'string' && hours.includes(':')) {
      // Formato HH:MM - validar y usar directamente
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(hours)) {
        return NextResponse.json(
          { error: 'Formato de horas inválido. Use HH:MM (ej: 04:45)' },
          { status: 400 },
        );
      }
      hoursValue = hours;
    } else {
      // Formato decimal - convertir a HH:MM
      const decimalHours = typeof hours === 'number' ? hours : parseFloat(hours);
      if (isNaN(decimalHours) || decimalHours < 0) {
        return NextResponse.json({ error: 'Horas inválidas' }, { status: 400 });
      }
      const h = Math.floor(decimalHours);
      const m = Math.round((decimalHours - h) * 60);
      hoursValue = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const config = getSheetsConfig();
    const sheets = await getGoogleSheetsClient();

    // Verificar si la hoja "Ore Manuali" existe, si no, crearla
    try {
      await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A1');
    } catch {
      // Crear la hoja si no existe
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.sheets.resources,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === 'Ore Manuali',
      );

      if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.sheets.resources,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Ore Manuali',
                  },
                },
              },
            ],
          },
        });

        // Agregar headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheets.resources,
          range: 'Ore Manuali!A1:E1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['ID', 'ID Risorsa', 'Data', 'Ore', 'Note']],
          },
        });
      }
    }

    // Leer datos existentes para obtener el próximo ID
    let manualHoursData: string[][] = [];
    try {
      manualHoursData = await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E');
    } catch {
      manualHoursData = [['ID', 'ID Risorsa', 'Data', 'Ore', 'Note']];
    }

    const nextId = manualHoursData.length.toString();

    // Verificar si ya existe una entrada para este recurso y fecha
    const existingRowIndex = manualHoursData.findIndex(
      (row, index) => index > 0 && row[1] === resourceId && row[2] === date,
    );

    if (existingRowIndex > 0) {
      // Actualizar fila existente (mantener el ID existente)
      const existingId = manualHoursData[existingRowIndex][0];
      const rowNumber = existingRowIndex + 1;
      const updatedRow = [existingId, resourceId, date, hoursValue, notes || ''];

      await sheets.spreadsheets.values.update({
        spreadsheetId: config.sheets.resources,
        range: `Ore Manuali!A${rowNumber}:E${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updatedRow],
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Ore manuali aggiornate con successo',
        id: existingId,
      });
    } else {
      // Agregar nueva fila
      const newRow = [nextId, resourceId, date, hoursValue, notes || ''];
      await appendSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E', [newRow]);

      return NextResponse.json({
        success: true,
        message: 'Ore manuali salvate con successo',
        id: nextId,
      });
    }
  } catch (error) {
    console.error('Error saving manual hours:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Errore nel salvataggio delle ore manuali';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
