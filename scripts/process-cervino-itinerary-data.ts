import { getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

interface Reservation {
  property: string;
  code: string;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  notes?: string;
}

// Parsear las fechas del formato DD/MM o DD/MM/YYYY a YYYY-MM-DD
function parseDate(dateStr: string): string {
  const parts = dateStr.split('/');
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  
  // Si el mes es 1 (enero), es 2026 (año siguiente)
  // Si el mes es >= 11 (noviembre) o <= 12 (diciembre), es 2025
  const year = month === 1 ? 2026 : 2025;
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Mapear nombres de propiedades a nombres consistentes
function normalizePropertyName(condominio: string, code: string): string {
  const condominioLower = condominio.toLowerCase();
  
  if (condominioLower.includes('piccolo') || condominioLower.includes('rod')) {
    return `Condominio Piccolo Rododendro ${code}`;
  }
  if (condominioLower.includes('cretes') || condominioLower.includes('blanches')) {
    return `Cretes Blanches - Scala A Apt ${code.substring(1)}`;
  }
  if (condominioLower.includes('breuil')) {
    if (code === 'Q456') {
      return `Breuil Q456`;
    }
    if (code === 'T335') {
      return `Breuil T335`;
    }
    if (code === 'B215') {
      return `Centro Breuil B215`;
    }
    return `Breuil ${code}`;
  }
  if (condominioLower.includes('montabel')) {
    return `Condominio Montabel ${code}`;
  }
  if (condominioLower.includes('saint') || condominioLower.includes('theodule')) {
    return `Saint Theodule ${code}`;
  }
  
  return `${condominio} ${code}`;
}

async function processCervinoItineraryData() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📅 Procesando itinerario de Agenzia Cervino...\n');

    // Reservas extraídas del PDF
    const reservations: Reservation[] = [
      { property: 'PICCOLO RODODENDRO', code: 'Q427', checkin: '26/11', checkout: '30/11' },
      { property: 'CRETES BLANCHES', code: 'Q403', checkin: '26/11', checkout: '30/11', notes: 'SI PUO\' PULIRE DAL 24/11' },
      { property: 'BREUIL', code: 'Q456', checkin: '28/11', checkout: '5/12' },
      { property: 'MONTABEL', code: 'M112', checkin: '1/12', checkout: '16/12' },
      { property: 'SAINT THEODULE', code: 'T382', checkin: '1/12', checkout: '6/12' },
      { property: 'CENTRO BREUIL', code: 'B215', checkin: '3/12', checkout: '8/12' },
      { property: 'CRETES BLANCHES', code: 'Q401', checkin: '4/12', checkout: '8/12' },
      { property: 'BREUILK', code: 'T335', checkin: '4/12', checkout: '9/12' },
      { property: 'CRETES BLANCHES', code: 'Q413', checkin: '6/12', checkout: '11/12' },
      { property: 'PICCOLO ROD', code: 'Q427', checkin: '7/12', checkout: '14/12' },
      { property: 'SAINT THEODULE', code: 'T354', checkin: '7/12', checkout: '11/12' },
      { property: 'CRETES BLANCHES', code: 'Q403', checkin: '10/12', checkout: '14/12' },
      { property: 'CRETES BLANCHES', code: 'Q401', checkin: '13/12', checkout: '18/12' },
      { property: 'SAINT THEODULE', code: 'T354', checkin: '14/12', checkout: '20/12' },
      { property: 'CRETES BLANCHES', code: 'Q403', checkin: '19/12', checkout: '27/12' },
      { property: 'PICCOLO RODODENDRO', code: 'Q427', checkin: '20/12', checkout: '27/12' },
      { property: 'BREUIL', code: 'Q456', checkin: '20/12', checkout: '27/12' },
      { property: 'BREUIL', code: 'T335', checkin: '20/12', checkout: '27/12' },
      { property: 'PICCOLO RODODENDRO', code: 'Q427', checkin: '27/12', checkout: '3/1' },
      { property: 'BREUIL', code: 'Q456', checkin: '27/12', checkout: '3/1' },
      { property: 'BREUIL', code: 'T335', checkin: '27/12', checkout: '3/1' },
      { property: 'SAINT THEODULE', code: 'T354', checkin: '27/12', checkout: '3/1' },
      { property: 'SAINT THEODULE', code: 'T382', checkin: '27/12', checkout: '5/1' },
      { property: 'CRETES BLANCHES', code: 'Q403', checkin: '27/12', checkout: '3/1' },
      { property: 'CRETES BLANCHES', code: 'Q401', checkin: '27/12', checkout: '3/1' },
      { property: 'CRETES BLANCHES', code: 'Q413', checkin: '27/12', checkout: '4/1' },
    ];

    console.log(`📋 ${reservations.length} reserva(s) encontrada(s)\n`);

    // Leer propiedades existentes
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);

    // El cliente "Agenzia Cervino" tiene ID 7
    const cervinoClientId = '7';
    const cervinoClientName = 'Agenzia Cervino';

    // Leer calendario para obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    let nextCalendarId = calendarData.length;

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const newProperties: (string | number)[][] = [];
    const propertyMap = new Map<string, string>(); // code -> propertyId
    const cleaningEvents: (string | number)[][] = [];

    // Primero, crear/identificar todas las propiedades únicas
    const uniqueProperties = new Map<string, { name: string; code: string }>();
    
    reservations.forEach((res) => {
      const normalizedName = normalizePropertyName(res.property, res.code);
      if (!uniqueProperties.has(res.code)) {
        uniqueProperties.set(res.code, { name: normalizedName, code: res.code });
      }
    });

    console.log('🏠 Procesando propiedades...\n');

    for (const [code, propInfo] of uniqueProperties) {
      // Buscar si la propiedad ya existe
      let propertyId = '';
      let propertyExists = false;

      propertiesRows.forEach((row) => {
        const location = row[4]?.toString() || '';
        const client = row[2]?.toString() || '';
        const rowCode = row[24]?.toString() || '';
        
        if (client === cervinoClientName) {
          const codeMatch = rowCode === code;
          const locationMatch = location.toLowerCase().includes(propInfo.name.toLowerCase()) ||
                               location.toLowerCase().includes(code.toLowerCase());
          
          if (codeMatch || locationMatch) {
            propertyId = row[0]?.toString() || '';
            propertyExists = true;
          }
        }
      });

      // Crear propiedad si no existe
      if (!propertyExists) {
        const nextPropertyId = propertiesRows.length + newProperties.length + 1;
        propertyId = nextPropertyId.toString();

        const newProperty: (string | number)[] = [];
        newProperty[0] = propertyId;
        newProperty[1] = cervinoClientId;
        newProperty[2] = cervinoClientName;
        newProperty[3] = '';
        newProperty[4] = propInfo.name;
        newProperty[5] = '';
        newProperty[6] = '';
        newProperty[7] = '';
        newProperty[8] = '';
        newProperty[9] = '';
        while (newProperty.length < 26) {
          newProperty.push('');
        }
        newProperty[24] = code; // Codice Riferimento

        newProperties.push(newProperty);
        propertyMap.set(code, propertyId);
        console.log(`   ✅ Propiedad creada: ${propInfo.name} (ID: ${propertyId}, código: ${code})`);
      } else {
        propertyMap.set(code, propertyId);
        console.log(`   ℹ️  Propiedad existente: ${propInfo.name} (ID: ${propertyId}, código: ${code})`);
      }
    }

    console.log('\n📅 Creando eventos de limpieza...\n');

    // Crear eventos de limpieza para cada reserva
    for (const reservation of reservations) {
      const propertyId = propertyMap.get(reservation.code);
      if (!propertyId) {
        console.log(`   ⚠️  No se encontró ID para código ${reservation.code}`);
        continue;
      }

      const normalizedName = normalizePropertyName(reservation.property, reservation.code);
      
      // Parsear fechas
      const checkinDateStr = parseDate(reservation.checkin);
      const checkoutDateStr = parseDate(reservation.checkout);
      
      // Limpieza antes del check-in (día anterior al check-in)
      const checkinDate = new Date(checkinDateStr);
      const preCheckinDate = new Date(checkinDate);
      preCheckinDate.setDate(preCheckinDate.getDate() - 1);
      const preCheckinDateStr = preCheckinDate.toISOString().split('T')[0];
      const preCheckinDayName = dayNames[preCheckinDate.getDay()];

      const preCheckinEvent = [
        (nextCalendarId++).toString(),
        preCheckinDateStr,
        preCheckinDayName,
        '',
        '',
        'Lavoro',
        'Profonda',
        propertyId,
        normalizedName,
        cervinoClientName,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        `Limpieza antes de check-in (${checkinDateStr})${reservation.notes ? ' - ' + reservation.notes : ''}`,
      ];
      cleaningEvents.push(preCheckinEvent);

      // Limpieza después del check-out (día del check-out)
      const checkoutDate = new Date(checkoutDateStr);
      const checkoutDayName = dayNames[checkoutDate.getDay()];

      const postCheckoutEvent = [
        (nextCalendarId++).toString(),
        checkoutDateStr,
        checkoutDayName,
        '',
        '',
        'Lavoro',
        'Profonda',
        propertyId,
        normalizedName,
        cervinoClientName,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        `Limpieza después de check-out (${checkoutDateStr})`,
      ];
      cleaningEvents.push(postCheckoutEvent);

      console.log(`   ✅ ${normalizedName}:`);
      console.log(`      - Pre-checkin: ${preCheckinDateStr} (antes de ${checkinDateStr})`);
      console.log(`      - Post-checkout: ${checkoutDateStr}`);
    }

    // Agregar propiedades nuevas
    if (newProperties.length > 0) {
      await appendSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z', newProperties);
      console.log(`\n✅ ${newProperties.length} propiedad(es) nueva(s) agregada(s)\n`);
    }

    // Agregar eventos de limpieza
    if (cleaningEvents.length > 0) {
      await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', cleaningEvents);
      console.log(`✅ ${cleaningEvents.length} evento(s) de limpieza creado(s)\n`);
    }

    console.log('✅ Proceso completado!\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

processCervinoItineraryData();

