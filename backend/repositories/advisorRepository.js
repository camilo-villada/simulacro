// Pool de conexión SQL.
const { sqlPool } = require('../config/db');

// Obtiene asesores; si llega canal, filtra por ese valor.
const getAll = async (channel) => {
  // Esta rama permite consultas tipo /api/advisors?channel=Nequi.
  if (channel) {
    const [rows] = await sqlPool.execute(
      'SELECT * FROM advisors WHERE channel = ?', [channel]
    );
    return rows;
  }
  const [rows] = await sqlPool.execute('SELECT * FROM advisors');
  return rows;
};

// Obtiene un asesor por su identificador primario.
const getById = async (id) => {
  const [rows] = await sqlPool.execute(
    'SELECT * FROM advisors WHERE id_advisor = ?', [id]
  );
  return rows[0];
};

// Actualiza datos de asesor por id.
const update = async (id, advisor) => {
  const [result] = await sqlPool.execute(
    'UPDATE advisors SET name=?, role=?, channel=?, city=? WHERE id_advisor=?',
    [advisor.name, advisor.role, advisor.channel, advisor.city, id]
  );
  return result.affectedRows;
};

// Exporta funciones para el controlador de asesores.
module.exports = { getAll, getById, update };