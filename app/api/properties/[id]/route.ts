import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetData } from '@/lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;
    const body = await request.json();

    // Leer configuración
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    const clientsSheetId = config.sheets.clients;
    const sheets = await getGoogleSheetsClient();

    // Leer todas las propiedades para encontrar la fila correcta
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');
    
    // Encontrar el índice de la propiedad (header + índice)
    const propertyIndex = propertiesData.findIndex((row) => row[0] === propertyId);
    
    if (propertyIndex === -1) {
      return NextResponse.json(
        { error: 'Proprietà non trovata' },
        { status: 404 }
      );
    }

    // Mapear los campos del body a las columnas del sheet
    // Orden de columnas: ID, ID Cliente, Nome Cliente, Nome Proprietario, Location, ...
    const rowIndex = propertyIndex + 1; // +1 porque las filas en Sheets empiezan en 1
    const currentRow = propertiesData[propertyIndex];
    
    // Crear nueva fila con los valores actualizados
    const updatedRow = [...currentRow];
    
    // Mapeo de campos a índices de columna (0-based, pero en Sheets API es 1-based)
    const fieldMap: Record<string, number> = {
      ownerName: 3,
      location: 4,
      typology: 5,
      agencyContact: 6,
      contact: 7,
      doormanContact: 8,
      accessInfo: 9,
      buildingEntry: 10,
      keys: 11,
      mapsLink: 12,
      services: 13,
      welcomeKit: 14,
      parking: 15,
      specialNotes: 16,
      timing: 17,
      washingMachine: 18,
      dishwasher: 19,
      doubleBeds: 20,
      singleBeds: 21,
      bedType: 22,
      bathrooms: 23,
      referenceCode: 24,
      comments: 25,
    };

    // Actualizar cada campo individualmente
    const updates: Array<{ range: string; values: string[][] }> = [];
    
    Object.keys(body).forEach((key) => {
      if (fieldMap[key] !== undefined) {
        const colIndex = fieldMap[key];
        // Convertir índice a letra de columna (A=0, B=1, etc.)
        const columnLetter = String.fromCharCode(65 + colIndex);
        const range = `Proprietà!${columnLetter}${rowIndex}`;
        updates.push({
          range,
          values: [[body[key] || '']],
        });
      }
    });

    // Actualizar todos los campos en una sola operación batch
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: clientsSheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Proprietà aggiornata con successo' });
  } catch (error) {
    console.error('Error updating property:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiornamento della proprietà';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

