// Librería para leer archivos Excel.
const XLSX = require('xlsx');
// Función para actualizar historial en MongoDB.
const { upsertClientHistory } = require('../repositories/mongoRepository');
// Repositorio SQL con inserciones idempotentes para la migración.
const {
  insertClient,
  insertAdvisor,
  insertPlatform,
  insertTransaction,
  insertValidation
} = require('../repositories/migrationRepository');

// Convierte fecha serial de Excel a formato YYYY-MM-DD.
const excelDateToString = (serial) => {
  // Excel guarda fechas como número de días desde una fecha base.
  if (typeof serial === 'number') {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  // Si ya viene como texto/fecha, se retorna tal cual.
  return serial;
};

// Procesa el archivo de migración fila por fila.
const processMigration = async (filePath) => {
  // Abre el workbook y toma la primera hoja.
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Convierte la hoja a arreglo de objetos (una fila = un objeto).
  const rows = XLSX.utils.sheet_to_json(sheet);

  // Acumula resultados para respuesta del endpoint.
  const results = { success: 0, errors: [] };

  // Recorre cada fila para crear/actualizar datos en SQL y MongoDB.
  for (const row of rows) {
    try {
      // 1) Inserta o recupera cliente.
      const id_client = await insertClient({
        name: row.client_name,
        email: row.client_email,
        phone: row.client_phone,
        city: row.client_city
      });

      // 2) Inserta o recupera asesor.
      const id_advisor = await insertAdvisor({
        name: row.advisor_name,
        role: row.advisor_role,
        channel: row.advisor_channel,
        city: row.advisor_city
      });

      // 3) Inserta o recupera plataforma.
      const id_platform = await insertPlatform({
        name: row.platform_name
      });

      // 4) Inserta transacción principal.
      const id_transaction = await insertTransaction({
        id_client,
        id_advisor,
        id_platform,
        amount: row.amount,
        date: excelDateToString(row.date),
        status: row.status
      });

      // 5) Si hay score y transacción válida, inserta validación.
      if (id_transaction && row.score) {
        await insertValidation({
          id_transaction,
          // Ajuste de escala cuando el score llega sobredimensionado.
          score: typeof row.score === 'number' && row.score > 100 
            ? row.score / 10000  
            : row.score,
          result: row.result,
          // Se usa la fecha de la fila como fecha de validación.
          validated_at: excelDateToString(row.date) 
  });
}

      // 6) Actualiza historial del cliente en MongoDB.
      await upsertClientHistory({
      id_client,
      client_name: row.client_name,
      client_email: row.client_email,
      advisor_name: row.advisor_name,
      transaction: {
        id_transaction,
        platform: row.platform_name,
        amount: row.amount,
        // Se normaliza fecha para mantener consistencia entre fuentes.
        date: excelDateToString(row.date), // ← convertir fecha
        status: row.status,
        // Se normaliza score para evitar valores fuera de escala esperada.
        score: typeof row.score === 'number' && row.score > 100
          ? row.score / 10000  // ← convertir score
          : row.score,
        result: row.result
  }
});

      // Incrementa contador de filas procesadas correctamente.
      results.success++;
    } catch (error) {
      // Guarda detalle de la fila fallida sin detener toda la migración.
      results.errors.push({ row, error: error.message });
    }
  }

  // Retorna resumen final del procesamiento.
  return results;
};

// Exporta servicio para el controlador de migración.
module.exports = { processMigration };