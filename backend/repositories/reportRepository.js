// Conexión SQL para ejecutar consultas analíticas.
const { sqlPool } = require('../config/db');

// 1. Top 5 clients with best validation average
const getTopClients = async () => {
  // Une clientes, transacciones y validaciones para calcular promedio de score.
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, AVG(v.score) as avg_score
    FROM clients c
    INNER JOIN transactions t ON c.id_client = t.id_client
    INNER JOIN validations v ON t.id_transaction = v.id_transaction
    GROUP BY c.id_client, c.name
    ORDER BY avg_score DESC
    LIMIT 5
  `);
  return rows;
};

// 2. Platforms with most transactions
const getPlatformsByTransactions = async () => {
  // Cuenta transacciones por plataforma.
  const [rows] = await sqlPool.execute(`
    SELECT p.name, COUNT(t.id_transaction) as total_transactions
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    GROUP BY p.id_platform, p.name
    ORDER BY total_transactions DESC
  `);
  return rows;
};

// 3. Clients without validations
const getClientsWithoutValidations = async () => {
  // LEFT JOIN + filtro NULL para detectar ausencia de validaciones.
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, c.email
    FROM clients c
    LEFT JOIN transactions t ON c.id_client = t.id_client
    LEFT JOIN validations v ON t.id_transaction = v.id_transaction
    WHERE v.id_validation IS NULL
  `);
  return rows;
};

// 4. Average amount per platform
const getAvgAmountByPlatform = async () => {
  // Promedio de monto por cada plataforma.
  const [rows] = await sqlPool.execute(`
    SELECT p.name, AVG(t.amount) as avg_amount
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    GROUP BY p.id_platform, p.name
  `);
  return rows;
};

// 5. Transactions between two dates
const getTransactionsByDateRange = async (startDate, endDate) => {
  // Filtra por BETWEEN usando parámetros para mayor seguridad.
  const [rows] = await sqlPool.execute(`
    SELECT t.*, c.name as client_name, p.name as platform_name
    FROM transactions t
    INNER JOIN clients c ON t.id_client = c.id_client
    INNER JOIN platforms p ON t.id_platform = p.id_platform
    WHERE t.date BETWEEN ? AND ?
  `, [startDate, endDate]);
  return rows;
};

// 6. Clients with more than 3 transactions
const getClientsWithMoreThan3Transactions = async () => {
  // HAVING filtra agregados (conteos) después del GROUP BY.
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, COUNT(t.id_transaction) as total
    FROM clients c
    INNER JOIN transactions t ON c.id_client = t.id_client
    GROUP BY c.id_client, c.name
    HAVING total > 3
  `);
  return rows;
};

// 7. Platforms without transactions
const getEmptyPlatforms = async () => {
  // Plataformas sin registros relacionados en transactions.
  const [rows] = await sqlPool.execute(`
    SELECT p.id_platform, p.name
    FROM platforms p
    LEFT JOIN transactions t ON p.id_platform = t.id_platform
    WHERE t.id_transaction IS NULL
  `);
  return rows;
};

// 8. General performance ranking by client
const getClientRanking = async () => {
  // Ranking general considerando volumen, monto y promedio de score.
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name,
      COUNT(t.id_transaction) as total_transactions,
      SUM(t.amount) as total_amount,
      AVG(v.score) as avg_score
    FROM clients c
    LEFT JOIN transactions t ON c.id_client = t.id_client
    LEFT JOIN validations v ON t.id_transaction = v.id_transaction
    GROUP BY c.id_client, c.name
    ORDER BY total_amount DESC
  `);
  return rows;
};

// 9. Last transaction per platform
const getLastTransactionByPlatform = async () => {
  // Subconsulta correlacionada para obtener la fecha máxima por plataforma.
  const [rows] = await sqlPool.execute(`
    SELECT p.name as platform, t.id_transaction, t.amount, t.date, t.status
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    WHERE t.date = (
      SELECT MAX(t2.date) FROM transactions t2
      WHERE t2.id_platform = p.id_platform
    )
  `);
  return rows;
};

// 10. Worst client by performance
const getWorstClient = async () => {
  // Ordena ascendente por score promedio para detectar peor desempeño.
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, AVG(v.score) as avg_score
    FROM clients c
    INNER JOIN transactions t ON c.id_client = t.id_client
    INNER JOIN validations v ON t.id_transaction = v.id_transaction
    GROUP BY c.id_client, c.name
    ORDER BY avg_score ASC
    LIMIT 1
  `);
  return rows[0];
};

// 11. Revenue report
const getRevenueReport = async (startDate, endDate) => {
  // Consulta 1: recaudo total histórico.
  const [total] = await sqlPool.execute(
    'SELECT SUM(amount) as total_revenue FROM transactions'
  );
  // Consulta 2: recaudo agrupado por plataforma.
  const [byPlatform] = await sqlPool.execute(`
    SELECT p.name, SUM(t.amount) as total
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    GROUP BY p.id_platform, p.name
  `);
  // Consulta 3: recaudo dentro del rango solicitado.
  const [byDateRange] = await sqlPool.execute(`
    SELECT SUM(amount) as total_in_range
    FROM transactions
    WHERE date BETWEEN ? AND ?
  `, [startDate, endDate]);

  return {
    // Estructura consolidada para respuesta del endpoint.
    total_revenue: total[0].total_revenue,
    by_platform: byPlatform,
    by_date_range: byDateRange[0].total_in_range
  };
};

// View: client performance
const getClientPerformanceView = async () => {
  // Lee la vista materializada lógicamente en SQL (no tabla física de negocio).
  const [rows] = await sqlPool.execute('SELECT * FROM v_client_performance');
  return rows;
};

// View: platform stats
const getPlatformStatsView = async () => {
  // Lee la vista de estadísticas de plataformas.
  const [rows] = await sqlPool.execute('SELECT * FROM v_platform_stats');
  return rows;
};

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