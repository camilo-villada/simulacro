// Servicio que ejecuta la migración desde archivo Excel.
const {processMigration} = require('../services/migrationService');

// Endpoint que recibe el archivo y dispara el proceso de migración.
const uploadMigration = async (req, res) => {
  try {
    // Validación: multer debe haber adjuntado el archivo en req.file.
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Procesa todas las filas del archivo y obtiene resumen de resultados.
    const results = await processMigration(req.file.path);

    // Respuesta estándar de éxito con cantidad procesada y errores por fila.
    res.status(200).json({ message: 'Migration completed', success: results.success, errors: results.errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Exporta controlador para usar en rutas de migración.
module.exports = { uploadMigration };