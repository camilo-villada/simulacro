// Router para endpoints respaldados por MongoDB.
const express = require('express');
const router = express.Router();
// Controlador con operaciones de feedback e historial.
const ctrl = require('../controllers/mongoController');

// Crea un feedback de cliente.
router.post('/feedback', ctrl.createFeedback);
// Lista feedback por id_client.
router.get('/feedback/:clientId', ctrl.getFeedbackByClient);

// Exporta router para montarlo en /api.
module.exports = router;