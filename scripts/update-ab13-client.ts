import { getSpreadsheetData, getGoogleSheetsClient } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function updateAB13Client() {
  try {
    const config = getSheetsConfig();

    console.log('🔄 Actualizando cliente AB13 y sus propiedades...\n');

    const sheets = await getGoogleSheetsClient();

    // 1. Buscar y actualizar el cliente AB13
    console.log('📋 Buscando cliente AB13...');
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);

    let ab13Client: { id: string; name: string; rowIndex: number } | null = null;

    clientsRows.forEach((row, index) => {
      const id = row[0] || '';
      const name = row[1] || '';
      if (name === 'AB13' || id === '4') { // ID 4 según la búsqueda anterior
        ab13Client = { id, name, rowIndex: index + 2 }; // +2 porque empieza en 1 y hay header
      }
    });

    if (!ab13Client) {
      console.log('❌ No se encontró el cliente AB13');
      return;
    }

    console.log(`   ✅ Cliente encontrado: "${ab13Client.name}" (ID: ${ab13Client.id}, fila ${ab13Client.rowIndex})`);
    console.log(`   📝 Actualizando nombre a "Andrea Bruzzo"...`);

    // Actualizar nombre del cliente
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheets.clients,
      range: `Clienti!B${ab13Client.rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Andrea Bruzzo']],
      },
    });

    console.log(`   ✅ Nombre del cliente actualizado\n`);

    // 2. Buscar y actualizar propiedades
    console.log('🏠 Buscando propiedades del cliente...');
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);

    const propertiesToUpdate: Array<{
      rowIndex: number;
      currentLocation: string;
      newLocation: string;
    }> = [];

    propertiesRows.forEach((row, index) => {
      const propertyClientId = row[1] || ''; // ID Cliente está en columna B
      const location = row[4] || ''; // Location está en columna E

      if (propertyClientId === ab13Client.id) {
        const locationLower = location.toLowerCase();
        
        // Identificar propiedades de Condominio Circus
        if (locationLower.includes('circus')) {
          // Necesitamos identificar cuál es cuál, pero como no sabemos el orden exacto,
          // vamos a listarlas primero para ver qué tenemos
          propertiesToUpdate.push({
            rowIndex: index + 2,
            currentLocation: location,
            newLocation: '', // Se determinará después
          });
        } else if (locationLower.includes('escargo')) {
          // Verificar que Escargo esté correcto
          if (location !== 'Escargo') {
            propertiesToUpdate.push({
              rowIndex: index + 2,
              currentLocation: location,
              newLocation: 'Escargo',
            });
          }
        }
      }
    });

    console.log(`   📊 Encontradas ${propertiesToUpdate.length} propiedades del cliente AB13\n`);

    // Listar todas las propiedades para identificar cuáles actualizar
    console.log('📋 Todas las propiedades de AB13/Andrea Bruzzo:');
    propertiesRows.forEach((row, index) => {
      const propertyClientId = row[1] || '';
      const location = row[4] || '';
      if (propertyClientId === ab13Client.id) {
        console.log(`   Fila ${index + 2}: "${location}"`);
      }
    });

    console.log('\n⚠️  Por favor, revisa las propiedades listadas arriba.');
    console.log('   Necesito que me indiques cuál propiedad corresponde a cada nombre:');
    console.log('   - CP1');
    console.log('   - 101');
    console.log('   - 44');
    console.log('   - 81');
    console.log('   - Escargo');
    console.log('\n   O puedo actualizar todas las que contengan "circus" con los nombres en orden.\n');

    // Actualizar todas las propiedades que contengan "circus" con los nombres en orden
    const circusProperties = propertiesRows
      .map((row, index) => ({
        rowIndex: index + 2,
        location: row[4] || '',
        clientId: row[1] || '',
      }))
      .filter(prop => prop.clientId === ab13Client.id && prop.location.toLowerCase().includes('circus'));

    const newNames = ['CP1', '101', '44', '81'];
    
    if (circusProperties.length === 4) {
      console.log('✅ Encontradas 4 propiedades de Condominio Circus, actualizando...\n');
      for (let i = 0; i < circusProperties.length; i++) {
        const prop = circusProperties[i];
        const newName = newNames[i];
        console.log(`   📝 "${prop.location}" → "${newName}"`);
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheets.clients,
          range: `Proprietà!E${prop.rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[newName]],
          },
        });
      }
      console.log(`   ✅ ${circusProperties.length} propiedades actualizadas\n`);
    } else {
      console.log(`⚠️  Se encontraron ${circusProperties.length} propiedades de Circus, esperaba 4.`);
      console.log('   Propiedades encontradas:');
      circusProperties.forEach(prop => {
        console.log(`     - "${prop.location}" (fila ${prop.rowIndex})`);
      });
    }

    // Actualizar Escargo si existe
    const escargoProperty = propertiesRows
      .map((row, index) => ({
        rowIndex: index + 2,
        location: row[4] || '',
        clientId: row[1] || '',
      }))
      .find(prop => prop.clientId === ab13Client.id && prop.location.toLowerCase().includes('escargo'));

    if (escargoProperty) {
      if (escargoProperty.location !== 'Escargo') {
        console.log(`📝 Actualizando "${escargoProperty.location}" → "Escargo"`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheets.clients,
          range: `Proprietà!E${escargoProperty.rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Escargo']],
          },
        });
        console.log('   ✅ Escargo actualizado\n');
      } else {
        console.log('   ✅ Escargo ya está correcto\n');
      }
    } else {
      console.log('   ⚠️  No se encontró la propiedad "Escargo"\n');
    }

    // Actualizar nombre del cliente en todas las propiedades
    console.log('📝 Actualizando nombre del cliente en todas las propiedades...');
    const allProperties = propertiesRows
      .map((row, index) => ({
        rowIndex: index + 2,
        clientId: row[1] || '',
        clientName: row[2] || '',
      }))
      .filter(prop => prop.clientId === ab13Client.id && prop.clientName !== 'Andrea Bruzzo');

    if (allProperties.length > 0) {
      for (const prop of allProperties) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheets.clients,
          range: `Proprietà!C${prop.rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Andrea Bruzzo']],
          },
        });
      }
      console.log(`   ✅ ${allProperties.length} propiedades actualizadas con nuevo nombre de cliente\n`);
    }

    // Actualizar eventos que referencian AB13
    console.log('📅 Actualizando eventos...');
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);
    const eventsToUpdate: Array<{ rowIndex: number }> = [];

    calendarRows.forEach((row, index) => {
      const eventClientName = row[9] || ''; // Nombre Cliente está en columna J
      if (eventClientName === 'AB13') {
        eventsToUpdate.push({ rowIndex: index + 2 });
      }
    });

    if (eventsToUpdate.length > 0) {
      console.log(`   Encontrados ${eventsToUpdate.length} eventos para actualizar`);
      for (const { rowIndex } of eventsToUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheets.calendar,
          range: `Calendario!J${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Andrea Bruzzo']],
          },
        });
      }
      console.log(`   ✅ ${eventsToUpdate.length} eventos actualizados\n`);
    } else {
      console.log('   ℹ️  No se encontraron eventos para actualizar\n');
    }

    console.log('✅ Actualización completada exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Cliente actualizado: "AB13" → "Andrea Bruzzo"`);
    console.log(`   - Propiedades de Circus actualizadas: ${circusProperties.length}`);
    console.log(`   - Propiedades con nombre de cliente actualizado: ${allProperties.length}`);
    console.log(`   - Eventos actualizados: ${eventsToUpdate.length}`);
  } catch (error) {
    console.error('❌ Error en la actualización:', error);
    throw error;
  }
}

updateAB13Client();

