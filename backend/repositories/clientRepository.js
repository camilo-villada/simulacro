// Pool de conexión MySQL compartido.
const { sqlPool } = require('../config/db');

// Consulta todos los clientes.
const getAll = async () => {
  // Ejecuta SELECT directo sobre tabla clients.
  const [rows] = await sqlPool.execute('SELECT * FROM clients');
  return rows;
};

// Busca un cliente por id.
const getById = async (id) => {
  const [rows] = await sqlPool.execute(
    // Parámetro preparado para evitar inyección SQL.
    'SELECT * FROM clients WHERE id_client = ?', [id]
  );
  // Retorna solo el primer registro encontrado.
  return rows[0];
};

// Inserta un cliente y devuelve su id autogenerado.
const create = async (client) => {
  const [result] = await sqlPool.execute(
    'INSERT INTO clients (name, email, phone, city) VALUES (?, ?, ?, ?)',
    // Orden de valores correspondiente a columnas del INSERT.
    [client.name, client.email, client.phone, client.city]
  );
  return result.insertId;
};

// Actualiza un cliente por id y devuelve filas afectadas.
const update = async (id, client) => {
  const [result] = await sqlPool.execute(
    'UPDATE clients SET name=?, email=?, phone=?, city=? WHERE id_client=?',
    [client.name, client.email, client.phone, client.city, id]
  );
  return result.affectedRows;
};

// Elimina un cliente por id y devuelve filas afectadas.
const remove = async (id) => {
  const [result] = await sqlPool.execute(
    'DELETE FROM clients WHERE id_client = ?', [id]
  );
  return result.affectedRows;
};

// Exporta funciones de acceso a datos de clientes.
module.exports = { getAll, getById, create, update, remove };