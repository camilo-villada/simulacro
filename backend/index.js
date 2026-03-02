// Importa Express para construir la API HTTP.
const express = require('express');
// Habilita CORS para permitir solicitudes desde el frontend.
const cors = require('cors');
// Función que inicia la conexión con MongoDB.
const {connectMongoDB} = require('./config/db');
// Carga variables de entorno desde el archivo .env.
require('dotenv').config();
// Importa cada módulo de rutas para separar responsabilidades por dominio.
const migrationRoutes = require('./routes/migrationRoutes');
const clientRoutes = require('./routes/clientRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const platformRoutes = require('./routes/platformRoutes');
const reportRoutes = require('./routes/reportRoutes');
const mongoRoutes = require('./routes/mongoRoutes');
// Crea la aplicación principal de Express.
const app = express();
// Activa CORS a nivel global.
app.use(cors());

// Middleware para parsear JSON en el cuerpo de las peticiones.
app.use(express.json());
// Middleware para parsear formularios URL-encoded.
app.use(express.urlencoded({extended: true}));


// Registro de rutas base de la API.
// Cada prefijo dirige la solicitud al router correspondiente.
app.use('/api/migration', migrationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', mongoRoutes); 

// Puerto de ejecución: toma PORT del .env y usa 5000 como respaldo.
const PORT = process.env.PORT || 5000;
// Inicia el servidor y, al arrancar, conecta con MongoDB.
// Se hace aquí para asegurar que la app quede enlazada a la base documental al iniciar.
app.listen(PORT, async () => {
    await connectMongoDB();
    // Mensaje de verificación en consola para confirmar arranque.
    console.log(`Server running on port ${PORT}`);
});

// Exporta la app para facilitar pruebas o reutilización.
module.exports = app;