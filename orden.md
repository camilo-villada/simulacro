# Guía de Construcción — ExpertSoft Fintech
### Paso a paso completo desde cero

---

## FASE 1 — Diseño y documentación

### Paso 1 — Crear la estructura de carpetas

Abre la terminal en la ubicación donde quieres el proyecto y ejecuta:

```bash
mkdir -p backend/uploads backend/config backend/controllers backend/services backend/repositories backend/routes frontend sql mongo docs
```

Esto crea todas las carpetas del proyecto de una sola vez.

---

### Paso 2 — Crear el DER en draw.io

Abre https://app.diagrams.net y crea un diagrama en blanco con 5 entidades:

```
CLIENTS
- id_client    INT (PK)
- name         VARCHAR(100)
- email        VARCHAR(100) UNIQUE
- phone        VARCHAR(20)
- city         VARCHAR(50)

ADVISORS
- id_advisor   INT (PK)
- name         VARCHAR(100)
- role         VARCHAR(50)
- channel      VARCHAR(20)  → solo 'Nequi' o 'Daviplata'
- city         VARCHAR(50)

PLATFORMS
- id_platform  INT (PK)
- name         VARCHAR(50) UNIQUE

TRANSACTIONS
- id_transaction  INT (PK)
- id_client       INT (FK → clients)
- id_advisor      INT (FK → advisors)
- id_platform     INT (FK → platforms)
- amount          DECIMAL(10,2)
- date            DATETIME
- status          VARCHAR(20) → 'completed', 'pending', 'failed'

VALIDATIONS
- id_validation   INT (PK)
- id_transaction  INT (FK → transactions) UNIQUE
- score           DECIMAL(4,2)
- result          VARCHAR(20) → 'approved', 'rejected'
- validated_at    DATETIME
```

**Cardinalidades:**
- clients → transactions: 1 a muchos
- advisors → transactions: 1 a muchos
- platforms → transactions: 1 a muchos
- transactions → validations: 1 a 1

Exporta como PNG y guarda en `/docs/DER.png`

---

### Paso 3 — Crear el archivo de normalización

Crea `/docs/normalization.md` con este contenido:

```markdown
# Proceso de Normalización

## Tabla Original (Sin normalizar)
Tabla plana como viene del archivo Excel:
| client_name | client_email | phone | city | advisor_name | 
channel | platform | amount | date | status | score | result |

## Primera Forma Normal (1FN)
- Se agregaron PKs: id_client, id_advisor, id_platform, id_transaction, id_validation
- Cada celda tiene un solo valor atómico
- No hay grupos repetidos
- Cada fila es identificable por su PK

Resultado: Una tabla con PKs definidas y valores atómicos.

## Segunda Forma Normal (2FN)
- Se eliminaron dependencias parciales
- Datos del cliente (name, email, phone, city) → tabla clients
- Datos del asesor (name, role, channel, city) → tabla advisors
- Datos de plataforma (name) → tabla platforms
- La tabla transactions solo conserva FKs y datos propios de la transacción

Resultado: 4 tablas: clients, advisors, platforms, transactions

## Tercera Forma Normal (3FN)
- Se eliminaron dependencias transitivas
- Los datos de validación se separaron en la tabla validations
- El campo result depende del score (score >= 3.0 = approved)
- Ninguna columna depende de otra columna que no sea la PK

Resultado: 5 tablas finales: clients, advisors, platforms, transactions, validations

## Decisiones de diseño
- clients: almacena datos únicos del cliente
- advisors: almacena datos únicos del asesor
- platforms: almacena Nequi y Daviplata como registros
- transactions: conecta todas las entidades, almacena monto, fecha y estado
- validations: almacena la verificación de pago por transacción
```

---

## FASE 2 — Base de datos SQL

### Paso 4 — Crear el script SQL

Crea `/sql/database.sql`:

```sql
CREATE DATABASE IF NOT EXISTS pd_camilo_villada_thompson;
USE pd_camilo_villada_thompson;

CREATE TABLE clients (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL
);

CREATE TABLE advisors (
    id_advisor INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('Nequi', 'Daviplata')),
    city VARCHAR(50) NOT NULL
);

CREATE TABLE platforms (
    id_platform INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE transactions (
    id_transaction INT AUTO_INCREMENT PRIMARY KEY,
    id_client INT NOT NULL,
    id_advisor INT NOT NULL,
    id_platform INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'pending', 'failed')),
    FOREIGN KEY (id_client) REFERENCES clients(id_client),
    FOREIGN KEY (id_advisor) REFERENCES advisors(id_advisor),
    FOREIGN KEY (id_platform) REFERENCES platforms(id_platform)
);

CREATE TABLE validations (
    id_validation INT AUTO_INCREMENT PRIMARY KEY,
    id_transaction INT NOT NULL UNIQUE,
    score DECIMAL(4,2) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('approved', 'rejected')),
    validated_at DATE NOT NULL,
    FOREIGN KEY (id_transaction) REFERENCES transactions(id_transaction)
);

-- Índices para optimizar consultas
CREATE INDEX idx_transactions_client   ON transactions(id_client);
CREATE INDEX idx_transactions_advisor  ON transactions(id_advisor);
CREATE INDEX idx_transactions_platform ON transactions(id_platform);
CREATE INDEX idx_transactions_date     ON transactions(date);
CREATE INDEX idx_validations_score     ON validations(score);

-- ================================================
-- LIMPIAR DATOS (usar si se necesita reiniciar)
-- ================================================
-- DELETE FROM validations;
-- DELETE FROM transactions;
-- DELETE FROM clients;
-- DELETE FROM advisors;
-- DELETE FROM platforms;
-- ALTER TABLE clients AUTO_INCREMENT = 1;
-- ALTER TABLE advisors AUTO_INCREMENT = 1;
-- ALTER TABLE platforms AUTO_INCREMENT = 1;
-- ALTER TABLE transactions AUTO_INCREMENT = 1;
-- ALTER TABLE validations AUTO_INCREMENT = 1;
```

---

### Paso 5 — Crear el script de vistas

Crea `/sql/views.sql`:

```sql
USE pd_camilo_villada_thompson;

CREATE OR REPLACE VIEW v_client_performance AS
SELECT
  c.id_client,
  c.name,
  c.email,
  COUNT(t.id_transaction) as total_transactions,
  SUM(t.amount) as total_amount,
  AVG(v.score) as avg_score
FROM clients c
LEFT JOIN transactions t ON c.id_client = t.id_client
LEFT JOIN validations v ON t.id_transaction = v.id_transaction
GROUP BY c.id_client, c.name, c.email;

CREATE OR REPLACE VIEW v_platform_stats AS
SELECT
  p.id_platform,
  p.name,
  COUNT(t.id_transaction) as total_transactions,
  SUM(t.amount) as total_amount,
  AVG(t.amount) as avg_amount
FROM platforms p
LEFT JOIN transactions t ON p.id_platform = t.id_platform
GROUP BY p.id_platform, p.name;
```

---

### Paso 6 — Crear el script de reset

Crea `/sql/reset.sql`:

```sql
USE pd_camilo_villada_thompson;

DELETE FROM validations;
DELETE FROM transactions;
DELETE FROM clients;
DELETE FROM advisors;
DELETE FROM platforms;

ALTER TABLE clients AUTO_INCREMENT = 1;
ALTER TABLE advisors AUTO_INCREMENT = 1;
ALTER TABLE platforms AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE validations AUTO_INCREMENT = 1;
```

---

### Paso 7 — Ejecutar los scripts en MySQL

```bash
mysql -u root -p < sql/database.sql
mysql -u root -p < sql/views.sql
```

Verificar que todo se creó:

```sql
mysql -u root -p
USE pd_camilo_villada_thompson;
SHOW TABLES;
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

---

## FASE 3 — Archivo Excel

### Paso 8 — Crear source.xlsx

Crea en Google Sheets o Excel un archivo con estas columnas exactas y guárdalo en `/backend/uploads/source.xlsx`:

```
client_name | client_email | client_phone | client_city | 
advisor_name | advisor_role | advisor_channel | advisor_city | 
platform_name | amount | date | status | score | result
```

Datos de ejemplo con 10 filas (algunos clientes se repiten para probar idempotencia):

| client_name | client_email | client_phone | client_city | advisor_name | advisor_role | advisor_channel | advisor_city | platform_name | amount | date | status | score | result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Juan Perez | juan@mail.com | 3001234567 | Bogota | Carlos Lopez | Asesor Comercial | Nequi | Medellin | Nequi | 150000 | 2024-01-15 | completed | 4.5 | approved |
| Maria Gomez | maria@mail.com | 3109876543 | Cali | Ana Torres | Asesor Senior | Daviplata | Bogota | Daviplata | 200000 | 2024-01-20 | completed | 3.8 | approved |
| Pedro Ruiz | pedro@mail.com | 3205556789 | Medellin | Carlos Lopez | Asesor Comercial | Nequi | Medellin | Nequi | 80000 | 2024-02-01 | failed | 1.5 | rejected |
| Juan Perez | juan@mail.com | 3001234567 | Bogota | Ana Torres | Asesor Senior | Daviplata | Bogota | Daviplata | 175000 | 2024-02-10 | completed | 4.2 | approved |
| Laura Diaz | laura@mail.com | 3154443322 | Barranquilla | Carlos Lopez | Asesor Comercial | Nequi | Medellin | Nequi | 95000 | 2024-02-15 | completed | 3.5 | approved |
| Maria Gomez | maria@mail.com | 3109876543 | Cali | Ana Torres | Asesor Senior | Daviplata | Bogota | Daviplata | 310000 | 2024-03-01 | completed | 4.8 | approved |
| Carlos Vera | carlos@mail.com | 3061112233 | Bogota | Carlos Lopez | Asesor Comercial | Nequi | Medellin | Nequi | 50000 | 2024-03-10 | pending | 2.1 | rejected |
| Pedro Ruiz | pedro@mail.com | 3205556789 | Medellin | Ana Torres | Asesor Senior | Daviplata | Bogota | Daviplata | 120000 | 2024-03-15 | completed | 3.9 | approved |
| Laura Diaz | laura@mail.com | 3154443322 | Barranquilla | Carlos Lopez | Asesor Comercial | Nequi | Medellin | Nequi | 220000 | 2024-03-20 | completed | 4.1 | approved |
| Carlos Vera | carlos@mail.com | 3061112233 | Bogota | Ana Torres | Asesor Senior | Daviplata | Bogota | Daviplata | 180000 | 2024-04-01 | failed | 1.8 | rejected |

---

## FASE 4 — Inicializar el backend

### Paso 9 — Inicializar Node.js en /backend

```bash
cd backend
npm init -y
```

---

### Paso 10 — Instalar dependencias del backend

```bash
npm install express cors multer xlsx mysql2 mongoose dotenv
npm install --save-dev nodemon
```

**Qué hace cada una:**
- `express` → servidor web
- `cors` → permite peticiones desde el frontend (evita error de CORS)
- `multer` → manejo de archivos subidos
- `xlsx` → leer archivos Excel
- `mysql2` → conexión a MySQL
- `mongoose` → conexión a MongoDB
- `dotenv` → leer variables de entorno desde .env
- `nodemon` → reinicia el servidor automáticamente al guardar cambios

---

### Paso 11 — Agregar script de desarrollo en package.json

Abre `/backend/package.json` y agrega dentro de `"scripts"`:

```json
"scripts": {
  "dev": "nodemon index.js"
}
```

---

### Paso 12 — Crear el archivo .env

Crea `/backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=pd_camilo_villada_thompson
MONGO_URI=mongodb://localhost:27017/pd_camilo_villada_thompson
```

---

## FASE 5 — Configuración de conexiones

### Paso 13 — Crear config/db.js

Crea `/backend/config/db.js`:

```js
const mysql = require('mysql2');
const mongoose = require('mongoose');
require('dotenv').config();

// Pool de conexiones MySQL - permite múltiples conexiones simultáneas
const sqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise();

// Función para conectar MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
  }
};

module.exports = { sqlPool, connectMongoDB };
```

---

### Paso 14 — Crear index.js

Crea `/backend/index.js`:

```js
const express = require('express');
const cors = require('cors');
const { connectMongoDB } = require('./config/db');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const migrationRoutes = require('./routes/migrationRoutes');
const clientRoutes    = require('./routes/clientRoutes');
const advisorRoutes   = require('./routes/advisorRoutes');
const platformRoutes  = require('./routes/platformRoutes');
const reportRoutes    = require('./routes/reportRoutes');
const mongoRoutes     = require('./routes/mongoRoutes');

app.use('/api/migration', migrationRoutes);
app.use('/api/clients',   clientRoutes);
app.use('/api/advisors',  advisorRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api',           mongoRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectMongoDB();
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
```

---

## FASE 6 — Migración

### Paso 15 — Crear migrationRepository.js

Crea `/backend/repositories/migrationRepository.js`:

```js
const { sqlPool } = require('../config/db');

// Inserta cliente si no existe, si ya existe devuelve su ID
const insertClient = async (client) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO clients (name, email, phone, city) VALUES (?, ?, ?, ?)`,
    [client.name, client.email, client.phone, client.city]
  );
  if (result.insertId === 0) {
    const [rows] = await sqlPool.execute(
      `SELECT id_client FROM clients WHERE email = ?`, [client.email]
    );
    return rows[0].id_client;
  }
  return result.insertId;
};

// Inserta asesor si no existe, si ya existe devuelve su ID
const insertAdvisor = async (advisor) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO advisors (name, role, channel, city) VALUES (?, ?, ?, ?)`,
    [advisor.name, advisor.role, advisor.channel, advisor.city]
  );
  if (result.insertId === 0) {
    const [rows] = await sqlPool.execute(
      `SELECT id_advisor FROM advisors WHERE name = ? AND channel = ?`,
      [advisor.name, advisor.channel]
    );
    return rows[0].id_advisor;
  }
  return result.insertId;
};

// Inserta plataforma si no existe, si ya existe devuelve su ID
const insertPlatform = async (platform) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO platforms (name) VALUES (?)`, [platform.name]
  );
  if (result.insertId === 0) {
    const [rows] = await sqlPool.execute(
      `SELECT id_platform FROM platforms WHERE name = ?`, [platform.name]
    );
    return rows[0].id_platform;
  }
  return result.insertId;
};

// Inserta transacción con los IDs obtenidos
const insertTransaction = async (transaction) => {
  const [result] = await sqlPool.execute(
    `INSERT IGNORE INTO transactions 
     (id_client, id_advisor, id_platform, amount, date, status) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [transaction.id_client, transaction.id_advisor, transaction.id_platform,
     transaction.amount, transaction.date, transaction.status]
  );
  return result.insertId;
};

// Inserta validación asociada a la transacción
const insertValidation = async (validation) => {
  await sqlPool.execute(
    `INSERT IGNORE INTO validations 
     (id_transaction, score, result, validated_at) VALUES (?, ?, ?, ?)`,
    [validation.id_transaction, validation.score,
     validation.result, validation.validated_at]
  );
};

module.exports = { insertClient, insertAdvisor, insertPlatform, insertTransaction, insertValidation };
```

---

### Paso 16 — Crear mongoRepository.js

Crea `/backend/repositories/mongoRepository.js`:

```js
const mongoose = require('mongoose');

// Esquema del historial de cliente en MongoDB
const clientHistorySchema = new mongoose.Schema({
  id_client: Number,
  client_name: String,
  client_email: String,
  advisor_name: String,
  transactions: Array
});

const ClientHistory = mongoose.model('client_histories', clientHistorySchema);

// Crea o actualiza el historial del cliente sin duplicar transacciones
const upsertClientHistory = async (clientData) => {
  await ClientHistory.findOneAndUpdate(
    { client_email: clientData.client_email },
    {
      $set: {
        id_client: clientData.id_client,
        client_name: clientData.client_name,
        client_email: clientData.client_email,
        advisor_name: clientData.advisor_name
      },
      $addToSet: { transactions: clientData.transaction }
    },
    { upsert: true, new: true }
  );
};

// Esquema de feedback en MongoDB
const feedbackSchema = new mongoose.Schema({
  id_client: Number,
  client_email: String,
  comment: String,
  rating: Number,
  created_at: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('feedback', feedbackSchema);

// Crea un nuevo comentario de feedback
const createFeedback = async (data) => {
  const feedback = new Feedback(data);
  return await feedback.save();
};

// Obtiene todos los feedbacks de un cliente por su ID
const getFeedbackByClient = async (clientId) => {
  return await Feedback.find({ id_client: Number(clientId) });
};

// Obtiene el historial completo de un cliente por su email
const getClientHistory = async (email) => {
  return await ClientHistory.findOne({ client_email: email });
};

module.exports = { upsertClientHistory, createFeedback, getFeedbackByClient, getClientHistory };
```

---

### Paso 17 — Crear migrationService.js

Crea `/backend/services/migrationService.js`:

```js
const XLSX = require('xlsx');
const { upsertClientHistory } = require('../repositories/mongoRepository');
const { insertClient, insertAdvisor, insertPlatform,
        insertTransaction, insertValidation } = require('../repositories/migrationRepository');

// Convierte número serial de Excel a fecha en formato string
const excelDateToString = (serial) => {
  if (typeof serial === 'number') {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  return serial;
};

const processMigration = async (filePath) => {
  // Leer el archivo Excel y convertir a JSON
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const results = { success: 0, errors: [] };

  // Procesar cada fila del Excel
  for (const row of rows) {
    try {
      // 1. Insertar entidades únicas y obtener sus IDs
      const id_client   = await insertClient({ name: row.client_name, email: row.client_email, phone: row.client_phone, city: row.client_city });
      const id_advisor  = await insertAdvisor({ name: row.advisor_name, role: row.advisor_role, channel: row.advisor_channel, city: row.advisor_city });
      const id_platform = await insertPlatform({ name: row.platform_name });

      // 2. Insertar transacción con los IDs obtenidos
      const id_transaction = await insertTransaction({
        id_client, id_advisor, id_platform,
        amount: row.amount,
        date: excelDateToString(row.date),
        status: row.status
      });

      // 3. Insertar validación si la transacción fue creada
      if (id_transaction && row.score) {
        await insertValidation({
          id_transaction,
          score: typeof row.score === 'number' && row.score > 100 ? row.score / 10000 : row.score,
          result: row.result,
          validated_at: excelDateToString(row.date)
        });
      }

      // 4. Actualizar historial en MongoDB
      await upsertClientHistory({
        id_client, client_name: row.client_name,
        client_email: row.client_email, advisor_name: row.advisor_name,
        transaction: {
          id_transaction, platform: row.platform_name,
          amount: row.amount, date: excelDateToString(row.date),
          status: row.status,
          score: typeof row.score === 'number' && row.score > 100 ? row.score / 10000 : row.score,
          result: row.result
        }
      });

      results.success++;
    } catch (error) {
      results.errors.push({ row, error: error.message });
    }
  }
  return results;
};

module.exports = { processMigration };
```

---

### Paso 18 — Crear migrationController.js

Crea `/backend/controllers/migrationController.js`:

```js
const { processMigration } = require('../services/migrationService');

const uploadMigration = async (req, res) => {
  try {
    // Verificar que se subió un archivo
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    
    const results = await processMigration(req.file.path);
    res.status(200).json({ 
      message: 'Migración completada', 
      success: results.success, 
      errors: results.errors 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadMigration };
```

---

### Paso 19 — Crear migrationRoutes.js

Crea `/backend/routes/migrationRoutes.js`:

```js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadMigration } = require('../controllers/migrationController');

// Configuración de multer para guardar el archivo en la carpeta uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

// Ruta para subir el archivo Excel
router.post('/upload', upload.single('file'), uploadMigration);

module.exports = router;
```

---

## FASE 7 — CRUD de entidades

### Paso 20 — Crear clientRepository.js

Crea `/backend/repositories/clientRepository.js`:

```js
const { sqlPool } = require('../config/db');

const getAll = async () => {
  const [rows] = await sqlPool.execute('SELECT * FROM clients');
  return rows;
};

const getById = async (id) => {
  const [rows] = await sqlPool.execute('SELECT * FROM clients WHERE id_client = ?', [id]);
  return rows[0];
};

const create = async (client) => {
  const [result] = await sqlPool.execute(
    'INSERT INTO clients (name, email, phone, city) VALUES (?, ?, ?, ?)',
    [client.name, client.email, client.phone, client.city]
  );
  return result.insertId;
};

const update = async (id, client) => {
  const [result] = await sqlPool.execute(
    'UPDATE clients SET name=?, email=?, phone=?, city=? WHERE id_client=?',
    [client.name, client.email, client.phone, client.city, id]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await sqlPool.execute('DELETE FROM clients WHERE id_client = ?', [id]);
  return result.affectedRows;
};

module.exports = { getAll, getById, create, update, remove };
```

---

### Paso 21 — Crear clientController.js

Crea `/backend/controllers/clientController.js`:

```js
const clientRepo = require('../repositories/clientRepository');

const getAll = async (req, res) => {
  try {
    const clients = await clientRepo.getAll();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const client = await clientRepo.getById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;
    if (!name || !email || !phone || !city)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const id = await clientRepo.create({ name, email, phone, city });
    res.status(201).json({ id_client: id, name, email, phone, city });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El email ya existe' });
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;
    if (!name || !email || !phone || !city)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const affected = await clientRepo.update(req.params.id, { name, email, phone, city });
    if (!affected) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(200).json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const affected = await clientRepo.remove(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'El cliente tiene transacciones, no se puede eliminar' });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
```

---

### Paso 22 — Crear clientRoutes.js

Crea `/backend/routes/clientRoutes.js`:

```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientController');
const mongoCtrl = require('../controllers/mongoController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:email/history', mongoCtrl.getClientHistory);

module.exports = router;
```

---

### Paso 23 — Crear advisorRepository.js

Crea `/backend/repositories/advisorRepository.js`:

```js
const { sqlPool } = require('../config/db');

// Si se pasa channel como parámetro, filtra por ese canal
const getAll = async (channel) => {
  if (channel) {
    const [rows] = await sqlPool.execute('SELECT * FROM advisors WHERE channel = ?', [channel]);
    return rows;
  }
  const [rows] = await sqlPool.execute('SELECT * FROM advisors');
  return rows;
};

const getById = async (id) => {
  const [rows] = await sqlPool.execute('SELECT * FROM advisors WHERE id_advisor = ?', [id]);
  return rows[0];
};

const update = async (id, advisor) => {
  const [result] = await sqlPool.execute(
    'UPDATE advisors SET name=?, role=?, channel=?, city=? WHERE id_advisor=?',
    [advisor.name, advisor.role, advisor.channel, advisor.city, id]
  );
  return result.affectedRows;
};

module.exports = { getAll, getById, update };
```

---

### Paso 24 — Crear advisorController.js

Crea `/backend/controllers/advisorController.js`:

```js
const advisorRepo = require('../repositories/advisorRepository');

const getAll = async (req, res) => {
  try {
    // req.query.channel viene de la URL: /api/advisors?channel=Nequi
    const advisors = await advisorRepo.getAll(req.query.channel);
    res.status(200).json(advisors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const advisor = await advisorRepo.getById(req.params.id);
    if (!advisor) return res.status(404).json({ error: 'Asesor no encontrado' });
    res.status(200).json(advisor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, role, channel, city } = req.body;
    if (!name || !role || !channel || !city)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const affected = await advisorRepo.update(req.params.id, { name, role, channel, city });
    if (!affected) return res.status(404).json({ error: 'Asesor no encontrado' });
    res.status(200).json({ message: 'Asesor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, update };
```

---

### Paso 25 — Crear advisorRoutes.js

Crea `/backend/routes/advisorRoutes.js`:

```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/advisorController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);

module.exports = router;
```

---

### Paso 26 — Crear platformRepository.js

Crea `/backend/repositories/platformRepository.js`:

```js
const { sqlPool } = require('../config/db');

const getAll = async () => {
  const [rows] = await sqlPool.execute('SELECT * FROM platforms');
  return rows;
};

const getById = async (id) => {
  const [rows] = await sqlPool.execute('SELECT * FROM platforms WHERE id_platform = ?', [id]);
  return rows[0];
};

const create = async (platform) => {
  const [result] = await sqlPool.execute('INSERT INTO platforms (name) VALUES (?)', [platform.name]);
  return result.insertId;
};

const update = async (id, platform) => {
  const [result] = await sqlPool.execute('UPDATE platforms SET name=? WHERE id_platform=?', [platform.name, id]);
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await sqlPool.execute('DELETE FROM platforms WHERE id_platform = ?', [id]);
  return result.affectedRows;
};

module.exports = { getAll, getById, create, update, remove };
```

---

### Paso 27 — Crear platformController.js

Crea `/backend/controllers/platformController.js`:

```js
const platformRepo = require('../repositories/platformRepository');

const getAll = async (req, res) => {
  try {
    const platforms = await platformRepo.getAll();
    res.status(200).json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const platform = await platformRepo.getById(req.params.id);
    if (!platform) return res.status(404).json({ error: 'Plataforma no encontrada' });
    res.status(200).json(platform);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const id = await platformRepo.create({ name });
    res.status(201).json({ id_platform: id, name });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'La plataforma ya existe' });
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const affected = await platformRepo.update(req.params.id, { name });
    if (!affected) return res.status(404).json({ error: 'Plataforma no encontrada' });
    res.status(200).json({ message: 'Plataforma actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const affected = await platformRepo.remove(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Plataforma no encontrada' });
    res.status(200).json({ message: 'Plataforma eliminada exitosamente' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'La plataforma tiene transacciones, no se puede eliminar' });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
```

---

### Paso 28 — Crear platformRoutes.js

Crea `/backend/routes/platformRoutes.js`:

```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/platformController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
```

---

## FASE 8 — Reportes y consultas SQL

### Paso 29 — Crear reportRepository.js

Crea `/backend/repositories/reportRepository.js`:

```js
const { sqlPool } = require('../config/db');

// 1. Top 5 clientes con mejor promedio de validación
const getTopClients = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, AVG(v.score) as avg_score
    FROM clients c
    INNER JOIN transactions t ON c.id_client = t.id_client
    INNER JOIN validations v ON t.id_transaction = v.id_transaction
    GROUP BY c.id_client, c.name
    ORDER BY avg_score DESC LIMIT 5
  `);
  return rows;
};

// 2. Plataformas con más transacciones
const getPlatformsByTransactions = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT p.name, COUNT(t.id_transaction) as total_transactions
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    GROUP BY p.id_platform, p.name
    ORDER BY total_transactions DESC
  `);
  return rows;
};

// 3. Clientes sin validaciones
const getClientsWithoutValidations = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, c.email
    FROM clients c
    LEFT JOIN transactions t ON c.id_client = t.id_client
    LEFT JOIN validations v ON t.id_transaction = v.id_transaction
    WHERE v.id_validation IS NULL
  `);
  return rows;
};

// 4. Promedio de monto por plataforma
const getAvgAmountByPlatform = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT p.name, AVG(t.amount) as avg_amount
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    GROUP BY p.id_platform, p.name
  `);
  return rows;
};

// 5. Transacciones entre dos fechas
const getTransactionsByDateRange = async (startDate, endDate) => {
  const [rows] = await sqlPool.execute(`
    SELECT t.*, c.name as client_name, p.name as platform_name
    FROM transactions t
    INNER JOIN clients c ON t.id_client = c.id_client
    INNER JOIN platforms p ON t.id_platform = p.id_platform
    WHERE t.date BETWEEN ? AND ?
  `, [startDate, endDate]);
  return rows;
};

// 6. Clientes con más de 3 transacciones
const getClientsWithMoreThan3Transactions = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, COUNT(t.id_transaction) as total
    FROM clients c
    INNER JOIN transactions t ON c.id_client = t.id_client
    GROUP BY c.id_client, c.name
    HAVING total > 3
  `);
  return rows;
};

// 7. Plataformas sin transacciones
const getEmptyPlatforms = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT p.id_platform, p.name
    FROM platforms p
    LEFT JOIN transactions t ON p.id_platform = t.id_platform
    WHERE t.id_transaction IS NULL
  `);
  return rows;
};

// 8. Ranking general de desempeño por cliente
const getClientRanking = async () => {
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

// 9. Última transacción de cada plataforma
const getLastTransactionByPlatform = async () => {
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

// 10. Cliente con peor desempeño
const getWorstClient = async () => {
  const [rows] = await sqlPool.execute(`
    SELECT c.id_client, c.name, AVG(v.score) as avg_score
    FROM clients c
    INNER JOIN transactions t ON c.id_client = t.id_client
    INNER JOIN validations v ON t.id_transaction = v.id_transaction
    GROUP BY c.id_client, c.name
    ORDER BY avg_score ASC LIMIT 1
  `);
  return rows[0];
};

// 11. Reporte de recaudo total, por plataforma y por rango de fechas
const getRevenueReport = async (startDate, endDate) => {
  const [total] = await sqlPool.execute('SELECT SUM(amount) as total_revenue FROM transactions');
  const [byPlatform] = await sqlPool.execute(`
    SELECT p.name, SUM(t.amount) as total
    FROM platforms p
    INNER JOIN transactions t ON p.id_platform = t.id_platform
    GROUP BY p.id_platform, p.name
  `);
  const [byDateRange] = await sqlPool.execute(`
    SELECT SUM(amount) as total_in_range FROM transactions WHERE date BETWEEN ? AND ?
  `, [startDate, endDate]);
  return { 
    total_revenue: total[0].total_revenue, 
    by_platform: byPlatform, 
    by_date_range: byDateRange[0].total_in_range 
  };
};

// Vista: desempeño de clientes
const getClientPerformanceView = async () => {
  const [rows] = await sqlPool.execute('SELECT * FROM v_client_performance');
  return rows;
};

// Vista: estadísticas de plataformas
const getPlatformStatsView = async () => {
  const [rows] = await sqlPool.execute('SELECT * FROM v_platform_stats');
  return rows;
};

module.exports = {
  getTopClients, getPlatformsByTransactions, getClientsWithoutValidations,
  getAvgAmountByPlatform, getTransactionsByDateRange, getClientsWithMoreThan3Transactions,
  getEmptyPlatforms, getClientRanking, getLastTransactionByPlatform, getWorstClient,
  getRevenueReport, getClientPerformanceView, getPlatformStatsView
};
```

---

### Paso 30 — Crear reportController.js

Crea `/backend/controllers/reportController.js`:

```js
const repo = require('../repositories/reportRepository');

const getTopClients = async (req, res) => {
  try { res.status(200).json(await repo.getTopClients()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getPlatformsByTransactions = async (req, res) => {
  try { res.status(200).json(await repo.getPlatformsByTransactions()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getClientsWithoutValidations = async (req, res) => {
  try { res.status(200).json(await repo.getClientsWithoutValidations()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getAvgAmountByPlatform = async (req, res) => {
  try { res.status(200).json(await repo.getAvgAmountByPlatform()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ error: 'startDate y endDate son obligatorios' });
    res.status(200).json(await repo.getTransactionsByDateRange(startDate, endDate));
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getClientsWithMoreThan3Transactions = async (req, res) => {
  try { res.status(200).json(await repo.getClientsWithMoreThan3Transactions()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getEmptyPlatforms = async (req, res) => {
  try { res.status(200).json(await repo.getEmptyPlatforms()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getClientRanking = async (req, res) => {
  try { res.status(200).json(await repo.getClientRanking()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getLastTransactionByPlatform = async (req, res) => {
  try { res.status(200).json(await repo.getLastTransactionByPlatform()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getWorstClient = async (req, res) => {
  try { res.status(200).json(await repo.getWorstClient()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ error: 'startDate y endDate son obligatorios' });
    res.status(200).json(await repo.getRevenueReport(startDate, endDate));
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getClientPerformanceView = async (req, res) => {
  try { res.status(200).json(await repo.getClientPerformanceView()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

const getPlatformStatsView = async (req, res) => {
  try { res.status(200).json(await repo.getPlatformStatsView()); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = {
  getTopClients, getPlatformsByTransactions, getClientsWithoutValidations,
  getAvgAmountByPlatform, getTransactionsByDateRange, getClientsWithMoreThan3Transactions,
  getEmptyPlatforms, getClientRanking, getLastTransactionByPlatform, getWorstClient,
  getRevenueReport, getClientPerformanceView, getPlatformStatsView
};
```

---

### Paso 31 — Crear reportRoutes.js

Crea `/backend/routes/reportRoutes.js`:

```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');

router.get('/top-clients', ctrl.getTopClients);
router.get('/platforms-by-transactions', ctrl.getPlatformsByTransactions);
router.get('/clients-without-validations', ctrl.getClientsWithoutValidations);
router.get('/avg-amount-by-platform', ctrl.getAvgAmountByPlatform);
router.get('/transactions-by-date', ctrl.getTransactionsByDateRange);
router.get('/clients-more-than-3', ctrl.getClientsWithMoreThan3Transactions);
router.get('/empty-platforms', ctrl.getEmptyPlatforms);
router.get('/ranking', ctrl.getClientRanking);
router.get('/last-transaction-by-platform', ctrl.getLastTransactionByPlatform);
router.get('/worst-client', ctrl.getWorstClient);
router.get('/revenue', ctrl.getRevenueReport);
router.get('/client-performance', ctrl.getClientPerformanceView);
router.get('/platform-stats', ctrl.getPlatformStatsView);

module.exports = router;
```

---

## FASE 9 — Endpoints MongoDB

### Paso 32 — Crear mongoController.js

Crea `/backend/controllers/mongoController.js`:

```js
const mongoRepo = require('../repositories/mongoRepository');

const createFeedback = async (req, res) => {
  try {
    const { id_client, client_email, comment, rating } = req.body;
    if (!id_client || !client_email || !comment || !rating)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const data = await mongoRepo.createFeedback({ id_client, client_email, comment, rating });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFeedbackByClient = async (req, res) => {
  try {
    const data = await mongoRepo.getFeedbackByClient(req.params.clientId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientHistory = async (req, res) => {
  try {
    const data = await mongoRepo.getClientHistory(req.params.email);
    if (!data) return res.status(404).json({ error: 'Historial no encontrado' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createFeedback, getFeedbackByClient, getClientHistory };
```

---

### Paso 33 — Crear mongoRoutes.js

Crea `/backend/routes/mongoRoutes.js`:

```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mongoController');

router.post('/feedback', ctrl.createFeedback);
router.get('/feedback/:clientId', ctrl.getFeedbackByClient);

module.exports = router;
```

---

## FASE 10 — Frontend

### Paso 34 — Crear frontend/index.html

Crea `/frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ExpertSoft Fintech</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <nav>
    <h1>ExpertSoft Fintech</h1>
    <div>
      <button onclick="showSection('dashboard')">Dashboard</button>
      <button onclick="showSection('clients')">Clientes</button>
      <button onclick="showSection('reports')">Reportes</button>
    </div>
  </nav>

  <!-- DASHBOARD -->
  <section id="dashboard" class="section">
    <h2>Dashboard</h2>
    <div class="cards">
      <div class="card">
        <h3>Total Clientes</h3>
        <p id="total-clients">-</p>
      </div>
      <div class="card">
        <h3>Plataformas</h3>
        <p id="total-platforms">-</p>
      </div>
      <div class="card">
        <h3>Total Recaudo</h3>
        <p id="total-revenue">-</p>
      </div>
    </div>
  </section>

  <!-- CLIENTES -->
  <section id="clients" class="section hidden">
    <h2>Clientes</h2>
    <form id="client-form">
      <input type="hidden" id="client-id">
      <input type="text" id="client-name" placeholder="Nombre" required>
      <input type="email" id="client-email" placeholder="Email" required>
      <input type="text" id="client-phone" placeholder="Teléfono" required>
      <input type="text" id="client-city" placeholder="Ciudad" required>
      <button type="submit">Guardar</button>
      <button type="button" onclick="resetForm()">Cancelar</button>
    </form>
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Nombre</th><th>Email</th>
          <th>Teléfono</th><th>Ciudad</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody id="clients-table"></tbody>
    </table>
  </section>

  <!-- REPORTES -->
  <section id="reports" class="section hidden">
    <h2>Reportes</h2>
    <div class="report-buttons">
      <button onclick="loadReport('top-clients')">Top Clientes</button>
      <button onclick="loadReport('ranking')">Ranking</button>
      <button onclick="loadReport('worst-client')">Peor Cliente</button>
      <button onclick="loadReport('empty-platforms')">Plataformas Vacías</button>
    </div>
    <div id="report-result"></div>
  </section>

  <script src="app.js"></script>
</body>
</html>
```

---

### Paso 35 — Crear frontend/style.css

Crea `/frontend/style.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

body {
  background: #f0f2f5;
  color: #333;
}

nav {
  background: #1a73e8;
  color: white;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav button {
  background: white;
  color: #1a73e8;
  border: none;
  padding: 8px 16px;
  margin-left: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

nav button:hover { background: #e8f0fe; }

.section { padding: 30px; }
.hidden { display: none; }

.cards {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.card {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex: 1;
  text-align: center;
}

.card h3 { color: #666; margin-bottom: 10px; }
.card p { font-size: 2rem; font-weight: bold; color: #1a73e8; }

form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

form input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  min-width: 150px;
}

form button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

form button[type="submit"] { background: #1a73e8; color: white; }
form button[type="button"] { background: #ddd; color: #333; }

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

th { background: #1a73e8; color: white; padding: 12px; text-align: left; }
td { padding: 12px; border-bottom: 1px solid #eee; }
tr:hover { background: #f5f5f5; }

.btn-edit {
  background: #fbbc04;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-delete {
  background: #ea4335;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.report-buttons {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.report-buttons button {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.report-buttons button:hover { background: #1557b0; }

#report-result {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

---

### Paso 36 — Crear frontend/app.js

Crea `/frontend/app.js`:

```js
const API = 'http://localhost:3000/api';

// Muestra la sección seleccionada y oculta las demás
const showSection = (id) => {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  if (id === 'dashboard') loadDashboard();
  if (id === 'clients') loadClients();
};

// Carga las métricas del dashboard
const loadDashboard = async () => {
  const clients = await fetch(`${API}/clients`).then(r => r.json());
  const platforms = await fetch(`${API}/platforms`).then(r => r.json());
  const revenue = await fetch(`${API}/reports/revenue?startDate=2024-01-01&endDate=2025-12-31`).then(r => r.json());

  document.getElementById('total-clients').textContent = clients.length;
  document.getElementById('total-platforms').textContent = platforms.length;
  document.getElementById('total-revenue').textContent = '$' + Number(revenue.total_revenue).toLocaleString();
};

// Carga la tabla de clientes
const loadClients = async () => {
  const clients = await fetch(`${API}/clients`).then(r => r.json());
  const tbody = document.getElementById('clients-table');
  tbody.innerHTML = clients.map(c => `
    <tr>
      <td>${c.id_client}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.city}</td>
      <td>
        <button class="btn-edit" onclick="editClient(${c.id_client}, '${c.name}', '${c.email}', '${c.phone}', '${c.city}')">Editar</button>
        <button class="btn-delete" onclick="deleteClient(${c.id_client})">Eliminar</button>
      </td>
    </tr>
  `).join('');
};

// Llena el formulario con los datos del cliente a editar
const editClient = (id, name, email, phone, city) => {
  document.getElementById('client-id').value = id;
  document.getElementById('client-name').value = name;
  document.getElementById('client-email').value = email;
  document.getElementById('client-phone').value = phone;
  document.getElementById('client-city').value = city;
};

// Limpia el formulario
const resetForm = () => {
  document.getElementById('client-form').reset();
  document.getElementById('client-id').value = '';
};

// Elimina un cliente con confirmación
const deleteClient = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
  await fetch(`${API}/clients/${id}`, { method: 'DELETE' });
  loadClients();
};

// Maneja el envío del formulario para crear o actualizar
document.getElementById('client-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('client-id').value;
  const body = {
    name: document.getElementById('client-name').value,
    email: document.getElementById('client-email').value,
    phone: document.getElementById('client-phone').value,
    city: document.getElementById('client-city').value
  };

  if (id) {
    // Si hay ID, actualiza (PUT)
    await fetch(`${API}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } else {
    // Si no hay ID, crea (POST)
    await fetch(`${API}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  resetForm();
  loadClients();
});

// Carga un reporte y lo muestra en pantalla
const loadReport = async (type) => {
  const data = await fetch(`${API}/reports/${type}`).then(r => r.json());
  const div = document.getElementById('report-result');
  div.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
};

// Cargar dashboard al iniciar
loadDashboard();
```

---

## FASE 11 — Arranque completo

### Paso 37 — Instalar concurrently en la carpeta raíz

Desde la carpeta raíz del proyecto (no en /backend):

```bash
cd ..
npm init -y
npm install concurrently
```

Agrega en el `/package.json` de la raíz:

```json
"scripts": {
  "start": "concurrently \"cd backend && npm run dev\" \"cd frontend && npx serve .\""
}
```

---

### Paso 38 — Arrancar todo

```bash
npm start
```

Esto arranca simultáneamente:
- Backend en `http://localhost:3000`
- Frontend en el puerto que indique la terminal (ejemplo: `http://localhost:54168`)

---

### Paso 39 — Migrar los datos

En Postman:
- **Método:** POST
- **URL:** `http://localhost:3000/api/migration/upload`
- **Body:** form-data → Key: `file`, Type: File, Value: `source.xlsx`
- **Respuesta esperada:** `{"message":"Migración completada","success":10,"errors":[]}`

---

## Resumen del orden de creación

```
1.  Carpetas del proyecto (mkdir)
2.  docs/DER.png (draw.io)
3.  docs/normalization.md
4.  sql/database.sql
5.  sql/views.sql
6.  sql/reset.sql
7.  Ejecutar scripts en MySQL
8.  backend/uploads/source.xlsx
9.  cd backend && npm init -y
10. npm install express cors multer xlsx mysql2 mongoose dotenv
11. npm install --save-dev nodemon
12. backend/.env
13. backend/config/db.js
14. backend/index.js
15. repositories/migrationRepository.js
16. repositories/mongoRepository.js
17. services/migrationService.js
18. controllers/migrationController.js
19. routes/migrationRoutes.js
20. repositories/clientRepository.js
21. controllers/clientController.js
22. routes/clientRoutes.js
23. repositories/advisorRepository.js
24. controllers/advisorController.js
25. routes/advisorRoutes.js
26. repositories/platformRepository.js
27. controllers/platformController.js
28. routes/platformRoutes.js
29. repositories/reportRepository.js
30. controllers/reportController.js
31. routes/reportRoutes.js
32. controllers/mongoController.js
33. routes/mongoRoutes.js
34. frontend/index.html
35. frontend/style.css
36. frontend/app.js
37. npm init -y en raíz + npm install concurrently
38. npm start
39. Migrar con Postman
```

---

## Comandos de referencia rápida

```bash
# Ejecutar scripts SQL
mysql -u root -p < sql/database.sql
mysql -u root -p < sql/views.sql
mysql -u root -p < sql/reset.sql

# Instalar dependencias backend
cd backend && npm install express cors multer xlsx mysql2 mongoose dotenv
cd backend && npm install --save-dev nodemon

# Instalar concurrently en raíz
npm install concurrently

# Arrancar todo
npm start

# Verificar tablas en MySQL
mysql -u root -p
USE pd_camilo_villada_thompson;
SHOW TABLES;
```