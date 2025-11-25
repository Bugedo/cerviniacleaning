import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updateBreuilProperties() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔄 Actualizando propiedades de Breuil para Il Cervino...\n');

    const clientsSheetId = config.sheets.clients;
    const sheets = await getGoogleSheetsClient();

    // Leer todas las propiedades
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');
    
    // Buscar propiedades de Il Cervino relacionadas con Breuil
    let breuilQ456Index = -1;
    let breuilT335Index = -1;
    const cervinoClientId = '7'; // ID de Il Cervino

    propertiesData.slice(1).forEach((row, index) => {
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (clientId === cervinoClientId) {
        // Buscar Q456 (5to piano)
        if (location.toLowerCase().includes('breuil') || 
            referenceCode.toLowerCase().includes('q456') ||
            location.toLowerCase().includes('5p') || 
            location.toLowerCase().includes('5to')) {
          breuilQ456Index = index + 1; // +1 porque el índice 0 es el header
        }
        // Buscar T335 (4to piano)
        if (referenceCode.toLowerCase().includes('t335') ||
            (location.toLowerCase().includes('breuil') && referenceCode.toLowerCase().includes('t335'))) {
          breuilT335Index = index + 1;
        }
      }
    });

    const updatedPropertiesData = [...propertiesData];

    // Actualizar o crear Q456 (5to piano)
    if (breuilQ456Index > 0) {
      console.log(`✅ Actualizando propiedad ID ${updatedPropertiesData[breuilQ456Index][0]} a Q456 (5to piano)`);
      updatedPropertiesData[breuilQ456Index][4] = 'Breuil Q456'; // Location
      updatedPropertiesData[breuilQ456Index][24] = 'Q456'; // Codice Riferimento
      // Actualizar Note Speciali para indicar el piano
      updatedPropertiesData[breuilQ456Index][16] = (updatedPropertiesData[breuilQ456Index][16] || '') + ' | 5to piano';
    } else {
      // Crear nueva propiedad Q456
      console.log('➕ Creando nueva propiedad Q456 (5to piano)');
      const maxId = Math.max(...updatedPropertiesData.slice(1).map(row => parseInt(row[0]?.toString() || '0')));
      const newQ456 = [
        (maxId + 1).toString(),
        cervinoClientId,
        'Il Cervino',
        '', // Nome Proprietario
        'Breuil Q456', // Location
        'Appartamento', // Tipologia Locale
        'Marco e/o Francesca', // Nome Referente Agenzia
        '0039 3405658263  Marco', // Contatto Referente
        '0039 3286621337  Francesca', // Contatto Portineria
        '5to piano con ascensore', // Informazioni Accesso
        'con chiavi', // Ingresso Stabile
        'Presenti e indicizzate in magazzino', // Chiavi
        'Link maps', // Link Google Maps
        'Kit biancheria fornito da Agenzia (non ci sono backup)', // Servizi e Dettagli
        'Fornito da Agenzia', // Kit di Benvenuto
        'Posto per carico scarico ricavabile davanti al portone. Parcheggio a 100 mt', // Presenza Parcheggio
        '5to piano | Molti suppellettili e divani. Necessari prodotti per legno.', // Note Speciali
        'Dalle 2 alle 4 ore con 2 risorse.', // Tempistiche
        'si', // Lavatrice
        'si', // Lavastoviglie
        '2', // Letti Matrimoniali
        '4', // Letti Singoli
        'inglese', // Letti Inglese/Italiana
        '3', // Bagni
        'Q456', // Codice Riferimento
        '', // Commenti
      ];
      updatedPropertiesData.push(newQ456);
    }

    // Crear o actualizar T335 (4to piano)
    if (breuilT335Index > 0) {
      console.log(`✅ Actualizando propiedad ID ${updatedPropertiesData[breuilT335Index][0]} a T335 (4to piano)`);
      updatedPropertiesData[breuilT335Index][4] = 'Breuil T335'; // Location
      updatedPropertiesData[breuilT335Index][24] = 'T335'; // Codice Riferimento
      updatedPropertiesData[breuilT335Index][16] = (updatedPropertiesData[breuilT335Index][16] || '') + ' | 4to piano';
    } else {
      // Crear nueva propiedad T335
      console.log('➕ Creando nueva propiedad T335 (4to piano)');
      const maxId = Math.max(...updatedPropertiesData.slice(1).map(row => parseInt(row[0]?.toString() || '0')));
      const newT335 = [
        (maxId + 1).toString(),
        cervinoClientId,
        'Il Cervino',
        '', // Nome Proprietario
        'Breuil T335', // Location
        'Appartamento', // Tipologia Locale
        'Marco e/o Francesca', // Nome Referente Agenzia
        '0039 3405658263  Marco', // Contatto Referente
        '0039 3286621337  Francesca', // Contatto Portineria
        '4to piano con ascensore', // Informazioni Accesso
        'con chiavi', // Ingresso Stabile
        'Presenti e indicizzate in magazzino', // Chiavi
        'Link maps', // Link Google Maps
        'Kit biancheria fornito da Agenzia (non ci sono backup)', // Servizi e Dettagli
        'Fornito da Agenzia', // Kit di Benvenuto
        'Posto per carico scarico ricavabile davanti al portone. Parcheggio a 100 mt', // Presenza Parcheggio
        '4to piano | Molti suppellettili e divani. Necessari prodotti per legno.', // Note Speciali
        'Dalle 2 alle 4 ore con 2 risorse.', // Tempistiche
        'si', // Lavatrice
        'si', // Lavastoviglie
        '2', // Letti Matrimoniali
        '4', // Letti Singoli
        'inglese', // Letti Inglese/Italiana
        '3', // Bagni
        'T335', // Codice Riferimento
        '', // Commenti
      ];
      updatedPropertiesData.push(newT335);
    }

    // Eliminar otras propiedades de Breuil que no sean Q456 o T335
    const propertiesToKeep: string[] = [];
    const propertiesToDelete: string[] = [];

    updatedPropertiesData.slice(1).forEach((row) => {
      const id = row[0]?.toString() || '';
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (clientId === cervinoClientId && 
          (location.toLowerCase().includes('breuil') || 
           location.toLowerCase().includes('5p') ||
           location.toLowerCase().includes('q456') ||
           location.toLowerCase().includes('t335'))) {
        // Verificar si es Q456 o T335
        if (referenceCode === 'Q456' || referenceCode === 'T335' ||
            (location.includes('Q456') && referenceCode === '') ||
            (location.includes('T335') && referenceCode === '')) {
          propertiesToKeep.push(id);
        } else {
          // Es otra propiedad de Breuil que debe eliminarse
          propertiesToDelete.push(id);
        }
      }
    });

    if (propertiesToDelete.length > 0) {
      console.log(`\n🗑️  Eliminando ${propertiesToDelete.length} propiedad(es) de Breuil que no son Q456 o T335:`);
      propertiesToDelete.forEach(id => {
        console.log(`   - ID ${id}`);
      });
      
      // Filtrar las propiedades a eliminar
      const filteredProperties = [
        updatedPropertiesData[0], // Header
        ...updatedPropertiesData.slice(1).filter(row => !propertiesToDelete.includes(row[0]?.toString() || ''))
      ];
      
      await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', filteredProperties);
      console.log('✅ Propiedades eliminadas\n');
    } else {
      // Solo actualizar sin eliminar
      await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', updatedPropertiesData);
    }

    console.log('✅ Actualización completada!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Q456 (5to piano): ${breuilQ456Index > 0 ? 'Actualizada' : 'Creada'}`);
    console.log(`   - T335 (4to piano): ${breuilT335Index > 0 ? 'Actualizada' : 'Creada'}`);
    if (propertiesToDelete.length > 0) {
      console.log(`   - Propiedades eliminadas: ${propertiesToDelete.length}\n`);
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updateBreuilProperties();

