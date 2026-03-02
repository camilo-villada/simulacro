// Repositorio con consultas analíticas y de reportes.
const repo = require('../repositories/reportRepository');

// Reporte 1: Top clientes por promedio de validación.
const getTopClients = async (req, res) => {
  try {
    const data = await repo.getTopClients();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 2: Plataformas ordenadas por número de transacciones.
const getPlatformsByTransactions = async (req, res) => {
  try {
    const data = await repo.getPlatformsByTransactions();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 3: Clientes sin validaciones registradas.
const getClientsWithoutValidations = async (req, res) => {
  try {
    const data = await repo.getClientsWithoutValidations();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 4: Monto promedio por plataforma.
const getAvgAmountByPlatform = async (req, res) => {
  try {
    const data = await repo.getAvgAmountByPlatform();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 5: Transacciones filtradas por rango de fechas.
const getTransactionsByDateRange = async (req, res) => {
  try {
    // Fechas requeridas como query params.
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ error: 'startDate and endDate are required' });
    const data = await repo.getTransactionsByDateRange(startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 6: Clientes con más de 3 transacciones.
const getClientsWithMoreThan3Transactions = async (req, res) => {
  try {
    const data = await repo.getClientsWithMoreThan3Transactions();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 7: Plataformas sin transacciones.
const getEmptyPlatforms = async (req, res) => {
  try {
    const data = await repo.getEmptyPlatforms();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 8: Ranking general de clientes.
const getClientRanking = async (req, res) => {
  try {
    const data = await repo.getClientRanking();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 9: Última transacción por plataforma.
const getLastTransactionByPlatform = async (req, res) => {
  try {
    const data = await repo.getLastTransactionByPlatform();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 10: Cliente con peor desempeño.
const getWorstClient = async (req, res) => {
  try {
    const data = await repo.getWorstClient();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte 11: Recaudo total, por plataforma y por rango de fechas.
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ error: 'startDate and endDate are required' });
    const data = await repo.getRevenueReport(startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte desde vista SQL v_client_performance.
const getClientPerformanceView = async (req, res) => {
  try {
    const data = await repo.getClientPerformanceView();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte desde vista SQL v_platform_stats.
const getPlatformStatsView = async (req, res) => {
  try {
    const data = await repo.getPlatformStatsView();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Exporta todos los handlers para enlazarlos en el router.
module.exports = {
  getTopClients,
  getPlatformsByTransactions,
  getClientsWithoutValidations,
  getAvgAmountByPlatform,
  getTransactionsByDateRange,
  getClientsWithMoreThan3Transactions,
  getEmptyPlatforms,
  getClientRanking,
  getLastTransactionByPlatform,
  getWorstClient,
  getRevenueReport,
  getClientPerformanceView,
  getPlatformStatsView
};