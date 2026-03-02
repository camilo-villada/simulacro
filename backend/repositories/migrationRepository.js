// Pool SQL para inserciones durante la migración.
const { sqlPool } = require('../config/db');

// Inserta cliente de forma idempotente.
const insertClient = async (client) => {
  const [result] = await sqlPool.execute(
    // INSERT IGNORE evita error por duplicados y permite re-ejecutar migración.
    `INSERT IGNORE INTO clients (name, email, phone, city) 
     VALUES (?, ?, ?, ?)`,
    [client.name, client.email, client.phone, client.city]
  );
  // Si insertId es 0, el cliente ya existía y se recupera su id actual.
  if (result.insertId === 0) {
    const [rows] = await sqlPool.execute(
      `SELECT id_client FROM clients WHERE email = ?`,
      [client.email]
    );
    return rows[0].id_client;
  }
  return result.insertId;
};

// Inserta asesor de forma idempotente.
const insertAdvisor = async (advisor) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO advisors (name, role, channel, city) 
     VALUES (?, ?, ?, ?)`,
    [advisor.name, advisor.role, advisor.channel, advisor.city]
  );
  // Si ya existe, se consulta el id existente por nombre+canal.
  if (result.insertId === 0) {
    const [rows] = await sqlPool.execute(
      `SELECT id_advisor FROM advisors WHERE name = ? AND channel = ?`,
      [advisor.name, advisor.channel]
    );
    return rows[0].id_advisor;
  }
  return result.insertId;
};

// Inserta plataforma de forma idempotente.
const insertPlatform = async (platform) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO platforms (name) VALUES (?)`,
    [platform.name]
  );
  // Si la plataforma ya existe, se devuelve su id.
  if (result.insertId === 0) {
    const [rows] = await sqlPool.execute(
      `SELECT id_platform FROM platforms WHERE name = ?`,
      [platform.name]
    );
    return rows[0].id_platform;
  }
  return result.insertId;
};

// Inserta transacción de forma idempotente.
const insertTransaction = async (transaction) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO transactions 
     (id_client, id_advisor, id_platform, amount, date, status) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      transaction.id_client,
      transaction.id_advisor,
      transaction.id_platform,
      transaction.amount,
      transaction.date,
      transaction.status
    ]
  );
  // Puede retornar 0 si ya existía por reglas de unicidad/duplicado.
  return result.insertId;
};

// Inserta validación asociada a la transacción.
const insertValidation = async (validation) => {
  await sqlPool.execute(
    `INSERT IGNORE INTO validations 
     (id_transaction, score, result, validated_at) 
     VALUES (?, ?, ?, ?)`,
    [
      validation.id_transaction,
      validation.score,
      validation.result,
      validation.validated_at
    ]
  );
};

// Exporta operaciones de migración para el servicio.
module.exports = {
  insertClient,
  insertAdvisor,
  insertPlatform,
  insertTransaction,
  insertValidation
};