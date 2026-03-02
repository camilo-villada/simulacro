// Pool SQL reutilizable.
const { sqlPool } = require('../config/db');

// Obtiene todas las plataformas.
const getAll = async () => {
  const [rows] = await sqlPool.execute('SELECT * FROM platforms');
  return rows;
};

// Obtiene una plataforma por id.
const getById = async (id) => {
  const [rows] = await sqlPool.execute(
    'SELECT * FROM platforms WHERE id_platform = ?', [id]
  );
  return rows[0];
};

// Inserta una plataforma y devuelve el id generado.
const create = async (platform) => {
  const [result] = await sqlPool.execute(
    'INSERT INTO platforms (name) VALUES (?)', [platform.name]
  );
  return result.insertId;
};

// Actualiza el nombre de una plataforma por id.
const update = async (id, platform) => {
  const [result] = await sqlPool.execute(
    'UPDATE platforms SET name=? WHERE id_platform=?',
    [platform.name, id]
  );
  return result.affectedRows;
};

// Elimina una plataforma por id.
const remove = async (id) => {
  const [result] = await sqlPool.execute(
    'DELETE FROM platforms WHERE id_platform = ?', [id]
  );
  return result.affectedRows;
};

// Exporta operaciones CRUD de plataformas.
module.exports = { getAll, getById, create, update, remove };