// Crea el router de Express para endpoints de clientes.
const express = require('express');
const router = express.Router();
// Controlador SQL de clientes.
const ctrl = require('../controllers/clientController');
// Controlador Mongo para historial del cliente.
const mongoCtrl = require('../controllers/mongoController');

// Lista todos los clientes.
router.get('/', ctrl.getAll);
// Busca cliente por id.
router.get('/:id', ctrl.getById);
// Crea cliente nuevo.
router.post('/', ctrl.create);
// Actualiza cliente existente.
router.put('/:id', ctrl.update);
// Elimina cliente por id.
router.delete('/:id', ctrl.remove);
// Consulta historial del cliente en MongoDB usando su email.
router.get('/:email/history', mongoCtrl.getClientHistory);

// Exporta el router para montarlo en /api/clients.
module.exports = router;