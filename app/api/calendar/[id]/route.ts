import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();

    const config = getSheetsConfig();

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Leer todos los trabajos para encontrar la fila correcta (hasta columna AG para 11 recursos + clientId)
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:AG');

    // Encontrar el índice del trabajo (header + índice)
    const jobIndex = calendarData.findIndex((row) => row[0] === jobId);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Lavoro non trovato' }, { status: 404 });
    }

    // Manejar casos especiales o casos normales
    if (body.isSpecialCase) {
      // Caso especial: usar nombres proporcionados directamente
      if (body.clientName) {
        body.client = body.clientName;
        body.clientId = 'SPECIAL';
      }
      if (body.propertyName) {
        body.propertyName = body.propertyName;
        body.propertyId = 'SPECIAL';
      }
      // Agregar nota especial
      body.notes = 'Caso Speciale';
    } else if (body.propertyId && body.propertyId !== 'SPECIAL') {
      // Caso normal: buscar en la base de datos
      const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
      const propertiesRows = propertiesData.slice(1);
      const property = propertiesRows.find((row) => row[0] === body.propertyId);
      if (property) {
        body.propertyName = property[4] || '';
        // También obtener el cliente de la propiedad
        const clientId = property[1] || '';
        const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
        const clientsRows = clientsData.slice(1);
        const client = clientsRows.find((row) => row[0] === clientId);
        if (client) {
          body.client = client[1] || '';
          body.clientId = clientId; // Agregar clientId
        }
      }
    } else if (body.clientName && body.propertyName) {
      // Si se proporcionan nombres pero no es caso especial explícito, actualizar directamente
      body.client = body.clientName;
      body.propertyName = body.propertyName;
    }

    // Si se actualiza un resourceId, obtener el nombre del recurso
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    // Mapeo de campos a índices de columna (hasta 11 recursos)
    const fieldMap: Record<string, number> = {
      date: 1, // Data (columna B)
      day: 2, // Giorno (columna C)
      startTime: 3, // Ora Inizio (columna D)
      endTime: 4, // Ora Fine (columna E)
      propertyId: 7, // ID Proprietà (columna H)
      propertyName: 8, // Nome Proprietà (columna I)
      client: 9, // Cliente (columna J)
      clientId: 10, // ID Cliente (columna K) - NUEVO
      cleaningType: 6, // Tipo di Pulizia (columna G)
      notes: 25, // Note (columna Z)
    };

    // Agregar mapeo para recursos 1-11 (ahora empiezan en índice 11)
    for (let i = 1; i <= 11; i++) {
      fieldMap[`resource${i}Id`] = 10 + (i - 1) * 2 + 1; // 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31
      fieldMap[`resource${i}Name`] = 10 + (i - 1) * 2 + 2; // 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32
    }

    // Obtener nombres de recursos si se actualiza un resourceId
    for (let i = 1; i <= 11; i++) {
      const resourceIdKey = `resource${i}Id` as keyof typeof body;
      if (body[resourceIdKey] !== undefined) {
        const resourceId = body[resourceIdKey] as string;
        if (resourceId && resourceId.trim() !== '') {
          // Si hay un ID, buscar el nombre
          const resource = resourcesRows.find((row) => row[0] === resourceId);
          if (resource) {
            const resourceName = `${resource[1] || ''} ${resource[2] || ''}`.trim();
            (body as Record<string, string>)[`resource${i}Name`] = resourceName;
          }
        } else {
          // Si el ID está vacío, limpiar también el nombre
          (body as Record<string, string>)[`resource${i}Name`] = '';
        }
      }
    }

    // Si se actualiza la fecha, también actualizar el día
    if (body.date) {
      const dayNames = [
        'Domenica',
        'Lunedì',
        'Martedì',
        'Mercoledì',
        'Giovedì',
        'Venerdì',
        'Sabato',
      ];
      const dateObj = new Date(body.date);
      body.day = dayNames[dateObj.getDay()];
    }

    const rowIndex = jobIndex + 1; // +1 porque las filas en Sheets empiezan en 1
    const updates: Array<{ range: string; values: string[][] }> = [];

    Object.keys(body).forEach((key) => {
      if (fieldMap[key] !== undefined) {
        const colIndex = fieldMap[key];
        // Convertir índice a letra de columna (A=0, B=1, etc.)
        // Para columnas después de Z, usar AA, AB, etc.
        let columnLetter = '';
        if (colIndex < 26) {
          columnLetter = String.fromCharCode(65 + colIndex);
        } else {
          // Para columnas después de Z (AA, AB, AC, etc.)
          const firstLetter = String.fromCharCode(65 + Math.floor((colIndex - 26) / 26));
          const secondLetter = String.fromCharCode(65 + ((colIndex - 26) % 26));
          columnLetter = firstLetter + secondLetter;
        }

        // Validar que la columna no exceda el rango
        if (colIndex > 31) {
          console.warn(`Columna ${colIndex} excede el rango esperado (máximo 31 = AF)`);
        }
        const range = `Calendario!${columnLetter}${rowIndex}`;
        updates.push({
          range,
          values: [[body[key] || '']],
        });
      }
    });

    // Actualizar todos los campos en una sola operación batch
    if (updates.length > 0) {
      try {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: calendarSheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates,
          },
        });
      } catch (updateError) {
        console.error('Error en batchUpdate:', updateError);
        console.error('Updates que se intentaron:', JSON.stringify(updates, null, 2));
        throw updateError;
      }
    }

    return NextResponse.json({ success: true, message: 'Lavoro aggiornato con successo' });
  } catch (error) {
    console.error('Error updating job:', error);
    const errorMessage =
      error instanceof Error ? error.message : "Errore nell'aggiornamento del lavoro";
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;

    const config = getSheetsConfig();

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Obtener sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: calendarSheetId,
    });

    const calendarSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === 'Calendario',
    );

    if (!calendarSheet?.properties?.sheetId) {
      throw new Error('No se encontró la hoja "Calendario"');
    }

    const sheetId = calendarSheet.properties.sheetId;

    // Leer calendario para encontrar la fila
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    const jobIndex = calendarData.findIndex((row) => row[0] === jobId);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Lavoro non trovato' }, { status: 404 });
    }

    const rowIndex = jobIndex + 1; // +1 porque las filas en Sheets empiezan en 1

    // Eliminar la fila
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: calendarSheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true, message: 'Lavoro eliminato con successo' });
  } catch (error) {
    console.error('Error deleting job:', error);
    const errorMessage =
      error instanceof Error ? error.message : "Errore nell'eliminazione del lavoro";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
