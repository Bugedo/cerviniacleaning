import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();

    const config = getSheetsConfig();

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Leer todos los trabajos para encontrar la fila correcta
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    
    // Encontrar el índice del trabajo (header + índice)
    const jobIndex = calendarData.findIndex((row) => row[0] === jobId);
    
    if (jobIndex === -1) {
      return NextResponse.json(
        { error: 'Lavoro non trovato' },
        { status: 404 }
      );
    }

    // Si se actualiza propertyId, obtener el nombre de la propiedad
    if (body.propertyId) {
      const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
      const propertiesRows = propertiesData.slice(1);
      const property = propertiesRows.find(row => row[0] === body.propertyId);
      if (property) {
        body.propertyName = property[4] || '';
        // También obtener el cliente de la propiedad
        const clientId = property[1] || '';
        const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
        const clientsRows = clientsData.slice(1);
        const client = clientsRows.find(row => row[0] === clientId);
        if (client) {
          body.client = client[1] || '';
        }
      }
    }

    // Mapeo de campos a índices de columna
    const fieldMap: Record<string, number> = {
      date: 1, // Data (columna B)
      day: 2, // Giorno (columna C)
      startTime: 3, // Ora Inizio (columna D)
      endTime: 4,   // Ora Fine (columna E)
      propertyId: 7, // ID Proprietà (columna H)
      propertyName: 8, // Nome Proprietà (columna I)
      client: 9, // Cliente (columna J)
      resource1Id: 10, // ID Risorsa 1 (columna K)
      resource2Id: 12, // ID Risorsa 2 (columna M)
      resource3Id: 14, // ID Risorsa 3 (columna O)
      resource4Id: 16, // ID Risorsa 4 (columna Q)
      resource5Id: 18, // ID Risorsa 5 (columna S)
      resource6Id: 20, // ID Risorsa 6 (columna U)
      cleaningType: 6, // Tipo di Pulizia (columna G)
    };

    // Si se actualiza la fecha, también actualizar el día
    if (body.date) {
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      const dateObj = new Date(body.date);
      body.day = dayNames[dateObj.getDay()];
    }

    const rowIndex = jobIndex + 1; // +1 porque las filas en Sheets empiezan en 1
    const updates: Array<{ range: string; values: string[][] }> = [];
    
    Object.keys(body).forEach((key) => {
      if (fieldMap[key] !== undefined) {
        const colIndex = fieldMap[key];
        // Convertir índice a letra de columna (A=0, B=1, etc.)
        const columnLetter = String.fromCharCode(65 + colIndex);
        const range = `Calendario!${columnLetter}${rowIndex}`;
        updates.push({
          range,
          values: [[body[key] || '']],
        });
      }
    });

    // Actualizar todos los campos en una sola operación batch
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: calendarSheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Lavoro aggiornato con successo' });
  } catch (error) {
    console.error('Error updating job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiornamento del lavoro';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const config = getSheetsConfig();

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Obtener sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: calendarSheetId,
    });
    
    const calendarSheet = spreadsheet.data.sheets?.find(sheet => 
      sheet.properties?.title === 'Calendario'
    );
    
    if (!calendarSheet?.properties?.sheetId) {
      throw new Error('No se encontró la hoja "Calendario"');
    }
    
    const sheetId = calendarSheet.properties.sheetId;

    // Leer calendario para encontrar la fila
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    const jobIndex = calendarData.findIndex((row) => row[0] === jobId);
    
    if (jobIndex === -1) {
      return NextResponse.json(
        { error: 'Lavoro non trovato' },
        { status: 404 }
      );
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
    const errorMessage = error instanceof Error ? error.message : 'Errore nell\'eliminazione del lavoro';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
