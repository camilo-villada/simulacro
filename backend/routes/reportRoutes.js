// Router para endpoints de reportes y analítica.
const express = require('express');
const router = express.Router();
// Controlador de reportes.
const ctrl = require('../controllers/reportController');

// Top 5 clientes por score promedio.
router.get('/top-clients', ctrl.getTopClients);
// Plataformas ordenadas por número de transacciones.
router.get('/platforms-by-transactions', ctrl.getPlatformsByTransactions);
// Clientes sin validaciones.
router.get('/clients-without-validations', ctrl.getClientsWithoutValidations);
// Promedio de monto por plataforma.
router.get('/avg-amount-by-platform', ctrl.getAvgAmountByPlatform);
// Transacciones por rango de fechas.
router.get('/transactions-by-date', ctrl.getTransactionsByDateRange);
// Clientes con más de 3 transacciones.
router.get('/clients-more-than-3', ctrl.getClientsWithMoreThan3Transactions);
// Plataformas sin transacciones.
router.get('/empty-platforms', ctrl.getEmptyPlatforms);
// Ranking de clientes.
router.get('/ranking', ctrl.getClientRanking);
// Última transacción por plataforma.
router.get('/last-transaction-by-platform', ctrl.getLastTransactionByPlatform);
// Cliente con peor score promedio.
router.get('/worst-client', ctrl.getWorstClient);
// Reporte de recaudo.
router.get('/revenue', ctrl.getRevenueReport);
// Vista SQL de desempeño de clientes.
router.get('/client-performance', ctrl.getClientPerformanceView);
// Vista SQL de estadísticas por plataforma.
router.get('/platform-stats', ctrl.getPlatformStatsView);

// Exporta router para /api/reports.
module.exports = router;