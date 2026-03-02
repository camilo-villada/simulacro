// Router para proceso de carga/migración de archivos.
const express = require('express');
const router = express.Router();
// Middleware para manejo de archivos multipart/form-data.
const multer = require('multer');
// Controlador que procesa la migración.
const { uploadMigration } = require('../controllers/migrationController');

// Configuración de Multer: guarda el archivo en la carpeta uploads.
const storage = multer.diskStorage({
  // Ruta destino donde se almacena el archivo temporal/subido.
  destination: (req, file, cb) =>  cb(null, 'uploads/'),
  // Mantiene el nombre original del archivo.
  filename: (req, file, cb) => cb(null, file.originalname) });

  // Instancia de upload con la configuración de almacenamiento.
  const upload = multer({ storage });

// Endpoint POST para subir archivo con key `file` y lanzar migración.
router.post('/upload', upload.single('file'), uploadMigration);

// Exporta router para /api/migration.
module.exports = router;