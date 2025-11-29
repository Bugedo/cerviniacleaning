# Estructura de Base de Datos - Cervinia Cleaning

## Estructura Relacional en Google Sheets

La aplicación utiliza Google Sheets como base de datos relacional con las siguientes tablas y relaciones:

### Tabla: Clienti (Clientes)
**Hoja:** `Clienti` en el spreadsheet de Clientes

| Columna | Tipo | Descripción | Relaciones |
|---------|------|-------------|------------|
| A: ID | String | Identificador único del cliente | PK |
| B: Nome | String | Nombre del cliente | |
| C: ... | ... | Otros campos del cliente | |

**Relaciones:**
- Un cliente tiene muchas propiedades (1:N)

---

### Tabla: Proprietà (Propiedades)
**Hoja:** `Proprietà` en el spreadsheet de Clientes

| Columna | Tipo | Descripción | Relaciones |
|---------|------|-------------|------------|
| A: ID | String | Identificador único de la propiedad | PK |
| B: ID Cliente | String | Referencia al cliente | FK → Clienti.ID |
| C: Nome Cliente | String | Nombre del cliente (denormalizado) | |
| D: Nome Proprietario | String | Nombre del propietario | |
| E: Location | String | Ubicación de la propiedad | |
| F-Z: ... | ... | Otros campos de la propiedad | |

**Relaciones:**
- Una propiedad pertenece a un cliente (N:1) → `ID Cliente` → `Clienti.ID`
- Una propiedad puede tener muchos eventos (1:N)

---

### Tabla: Risorse (Recursos/Empleados)
**Hoja:** `Risorse` en el spreadsheet de Recursos

| Columna | Tipo | Descripción | Relaciones |
|---------|------|-------------|------------|
| A: ID | String | Identificador único del recurso | PK |
| B: Nome | String | Nombre del empleado | |
| C: Cognome | String | Apellido del empleado | |
| D: Email | String | Email del empleado | |
| E: Telefono | String | Teléfono del empleado | |
| F: Ruolo | String | Rol (Coordinatore, Operatore) | |
| G: Attivo | String | Estado activo (Sì/No) | |

**Relaciones:**
- Un recurso puede participar en muchos eventos (N:M) a través de la tabla Calendario

---

### Tabla: Calendario (Eventos)
**Hoja:** `Calendario` en el spreadsheet de Calendario

| Columna | Tipo | Descripción | Relaciones |
|---------|------|-------------|------------|
| A: ID | String | Identificador único del evento | PK |
| B: Data | Date | Fecha del evento (YYYY-MM-DD) | |
| C: Giorno | String | Día de la semana | |
| D: Ora Inizio | Time | Hora de inicio (HH:MM) | |
| E: Ora Fine | Time | Hora de fin (HH:MM) | |
| F: Tipo | String | Tipo (Lavoro, Supervisione) | |
| G: Tipo di Pulizia | String | Tipo de limpieza (Profonda, Repasso) | |
| H: ID Proprietà | String | Referencia a la propiedad | FK → Proprietà.ID |
| I: Nome Proprietà | String | Nombre de la propiedad (denormalizado) | |
| J: Cliente | String | Nombre del cliente (denormalizado) | |
| K: ID Cliente | String | Referencia al cliente | FK → Clienti.ID |
| L-AG: Recursos | String | IDs y nombres de recursos (hasta 11) | FK → Risorse.ID |

**Estructura de Recursos (columnas L-AG):**
- L: ID Risorsa 1
- M: Nome Risorsa 1
- N: ID Risorsa 2
- O: Nome Risorsa 2
- ... (hasta 11 recursos)
- AG: Nome Risorsa 11

**Relaciones:**
- Un evento pertenece a una propiedad (N:1) → `ID Proprietà` → `Proprietà.ID`
- Un evento pertenece a un cliente (N:1) → `ID Cliente` → `Clienti.ID`
- Un evento puede tener hasta 11 recursos (N:M) → `ID Risorsa X` → `Risorse.ID`

---

## Normalización y Denormalización

### Campos Denormalizados (para rendimiento)
- `Nome Proprietà` en Calendario: Se guarda para evitar joins constantes
- `Cliente` en Calendario: Se guarda para mostrar rápidamente
- `Nome Risorsa X` en Calendario: Se guarda para mostrar rápidamente

### Campos Normalizados (para integridad)
- `ID Proprietà` en Calendario: Referencia a la propiedad
- `ID Cliente` en Calendario: Referencia al cliente (NUEVO)
- `ID Cliente` en Proprietà: Referencia al cliente
- `ID Risorsa X` en Calendario: Referencia al recurso

---

## Ventajas de esta Estructura

1. **Integridad Referencial**: Los IDs garantizan que los datos estén relacionados correctamente
2. **Rendimiento**: Los nombres denormalizados permiten mostrar datos sin joins
3. **Consistencia**: Los colores por cliente se basan en `ID Cliente`
4. **Escalabilidad**: Fácil agregar más relaciones en el futuro
5. **Mantenibilidad**: Estructura clara y documentada

---

## Migración

Para migrar eventos existentes y agregar `ID Cliente`:

```bash
npm run migrate-calendar-clientid
```

Este script:
1. Lee todos los eventos existentes
2. Busca el `ID Cliente` basado en la propiedad o nombre del cliente
3. Actualiza la columna K (ID Cliente) en cada evento

