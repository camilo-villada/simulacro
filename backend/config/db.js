// Librería para conectarse a MySQL.
const mysql = require('mysql2');
// Librería ODM para conectarse a MongoDB.
const mongoose = require('mongoose');
// Carga variables de entorno (credenciales y URIs).
require('dotenv').config();

// Pool de conexiones MySQL.
// Se usa pool para reutilizar conexiones y mejorar rendimiento.
const sqlPool = mysql.createPool({
  // Host del servidor MySQL.
  host: process.env.DB_HOST,
  // Usuario de base de datos.
  user: process.env.DB_USER,
  // Contraseña del usuario.
  password: process.env.DB_PASSWORD,
    // Nombre de la base de datos a utilizar.
    database: process.env.DB_NAME,
// `promise()` permite usar async/await en consultas SQL.
}).promise();

// Función asíncrona para establecer conexión con MongoDB.
const connectMongoDB = async () => {
  try {
    // Conecta usando la URI definida en variables de entorno.
    await mongoose.connect(process.env.MONGO_URI);
    // Log de conexión exitosa para diagnóstico.
    console.log('Connected to MongoDB');
  } catch (error) {
    // Log de error para facilitar depuración.
    console.error('Error connecting to MongoDB:', error);
  }
};

// Exporta el pool SQL y la función de conexión a MongoDB.
module.exports = {sqlPool, connectMongoDB};