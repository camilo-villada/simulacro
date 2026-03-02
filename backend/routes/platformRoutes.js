// Router para CRUD de plataformas.
const express = require('express');
const router = express.Router();
// Controlador de plataformas.
const ctrl = require('../controllers/platformController');

// Lista todas las plataformas.
router.get('/', ctrl.getAll);
// Consulta plataforma por id.
router.get('/:id', ctrl.getById);
// Crea plataforma.
router.post('/', ctrl.create);
// Actualiza plataforma.
router.put('/:id', ctrl.update);
// Elimina plataforma.
router.delete('/:id', ctrl.remove);

// Exporta router para /api/platforms.
module.exports = router;