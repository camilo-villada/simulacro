// Router para recursos de asesores.
const express = require('express');
const router = express.Router();
// Controlador con lógica de negocio de asesores.
const ctrl = require('../controllers/advisorController');

// Lista asesores (permite filtro por query channel).
router.get('/', ctrl.getAll);
// Obtiene asesor por id.
router.get('/:id', ctrl.getById);
// Actualiza asesor por id.
router.put('/:id', ctrl.update);

// Exporta router para /api/advisors.
module.exports = router;