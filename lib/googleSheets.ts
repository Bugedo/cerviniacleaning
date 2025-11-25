import { google } from 'googleapis';
import path from 'path';
import { readFileSync } from 'fs';

const credentialsPath = path.join(process.cwd(), 'cervinia-cleaning-2eef5bdde34b.json');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any = null;

export async function getGoogleSheetsClient() {
  if (!auth) {
    const credentials = JSON.parse(
      readFileSync(credentialsPath, 'utf8')
    );

    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });
  }

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function getGoogleDriveClient() {
  if (!auth) {
    const credentials = JSON.parse(
      readFileSync(credentialsPath, 'utf8')
    );

    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });
  }

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function createSpreadsheet(title: string, folderId?: string) {
  // Intentar crear usando Drive API primero (más permisos)
  try {
    const drive = await getGoogleDriveClient();
    
    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      ...(folderId && { parents: [folderId] }),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return file.data.id || '';
  } catch {
    // Si falla, intentar con Sheets API
    const sheets = await getGoogleSheetsClient();
    
    const resource = {
      properties: {
        title,
      },
    };

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: resource,
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId || '';

    // Si se especifica una carpeta, mover el archivo allí
    if (folderId && spreadsheetId) {
      const drive = await getGoogleDriveClient();
      
      try {
        // Obtener el archivo actual para obtener sus padres
        const file = await drive.files.get({
          fileId: spreadsheetId,
          fields: 'parents',
        });

        const previousParents = file.data.parents?.join(',') || '';

        // Mover el archivo a la nueva carpeta
        await drive.files.update({
          fileId: spreadsheetId,
          addParents: folderId,
          removeParents: previousParents,
          fields: 'id, parents',
        });
      } catch (moveError) {
        console.warn('No se pudo mover el archivo a la carpeta:', moveError);
      }
    }

    return spreadsheetId;
  }
}

export async function getSpreadsheetData(spreadsheetId: string, range: string) {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

export async function updateSpreadsheetData(
  spreadsheetId: string,
  range: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[][]
) {
  const sheets = await getGoogleSheetsClient();
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}

export async function appendSpreadsheetData(
  spreadsheetId: string,
  range: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[][]
) {
  const sheets = await getGoogleSheetsClient();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}

