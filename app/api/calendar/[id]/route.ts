import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetData } from '@/lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();

    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

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

    // Mapeo de campos a índices de columna
    const fieldMap: Record<string, number> = {
      startTime: 3, // Ora Inizio (columna D)
      endTime: 4,   // Ora Fine (columna E)
    };

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

