# Guía de Adaptación — Cómo usar este proyecto para cualquier dominio

---

## Paso 1 — Leer el enunciado y encontrar las 5 entidades

Hazte estas preguntas:

| Pregunta | Nuestro proyecto | Hospital | Escuela |
|---|---|---|---|
| ¿Quién es el actor principal? | client | patient | student |
| ¿Quién lo gestiona? | advisor | doctor | teacher |
| ¿A través de qué canal/categoría? | platform | department | course |
| ¿Cuál es el evento principal? | transaction | appointment | enrollment |
| ¿Cuál es el resultado del evento? | validation | diagnosis | grade |

---

## Paso 2 — Definir los campos de cada entidad

Sigue esta estructura, solo cambia los nombres:

```
ENTIDAD PRINCIPAL (clients)
- id_[entidad]     INT PK
- name             VARCHAR(100) NOT NULL
- email            VARCHAR(100) NOT NULL UNIQUE  ← siempre un campo único
- [campo propio 1] VARCHAR
- [campo propio 2] VARCHAR

ENTIDAD GESTORA (advisors)
- id_[entidad]     INT PK
- name             VARCHAR(100) NOT NULL
- role             VARCHAR(50) NOT NULL
- [canal/tipo]     VARCHAR(20) NOT NULL CHECK (... IN ('valor1', 'valor2'))
- [campo propio]   VARCHAR

ENTIDAD CATEGORIZADORA (platforms)
- id_[entidad]     INT PK
- name             VARCHAR(50) NOT NULL UNIQUE

EVENTO PRINCIPAL (transactions)
- id_[entidad]              INT PK
- id_[entidad_principal]    INT FK
- id_[entidad_gestora]      INT FK
- id_[entidad_categ]        INT FK
- [valor]                   DECIMAL(10,2)
- date                      DATE
- status                    VARCHAR(20) CHECK (... IN ('completed','pending','failed'))

RESULTADO (validations)
- id_[entidad]     INT PK
- id_[evento]      INT FK UNIQUE   ← UNIQUE garantiza relación 1 a 1
- score            DECIMAL(4,2)
- result           VARCHAR(20) CHECK (... IN ('approved','rejected'))
- [fecha]          DATE
```

---

## Paso 3 — Tabla de reemplazos rápidos

Usa `Ctrl+Shift+H` en VSCode para reemplazar en TODOS los archivos de una vez:

| Buscar | Reemplazar por (hospital) | Reemplazar por (escuela) |
|---|---|---|
| `clients` | `patients` | `students` |
| `client` | `patient` | `student` |
| `id_client` | `id_patient` | `id_student` |
| `advisors` | `doctors` | `teachers` |
| `advisor` | `doctor` | `teacher` |
| `id_advisor` | `id_doctor` | `id_teacher` |
| `platforms` | `departments` | `courses` |
| `platform` | `department` | `course` |
| `id_platform` | `id_department` | `id_course` |
| `transactions` | `appointments` | `enrollments` |
| `transaction` | `appointment` | `enrollment` |
| `id_transaction` | `id_appointment` | `id_enrollment` |
| `validations` | `diagnoses` | `grades` |
| `validation` | `diagnosis` | `grade` |
| `id_validation` | `id_diagnosis` | `id_grade` |
| `amount` | `cost` | `fee` |
| `score` | `rating` | `grade_value` |
| `channel` | `specialty` | `modality` |

> ⚠️ Después del reemplazo masivo revisa cada archivo para asegurarte
> que el texto tiene sentido y no quedaron nombres rotos.

---

## Paso 4 — Archivos que DEBES cambiar ✏️

### `sql/database.sql`
Cambia nombres de tablas, columnas y valores del CHECK:
```sql
-- Nuestro proyecto:
CREATE TABLE clients (id_client INT...
CHECK (channel IN ('Nequi', 'Daviplata'))

-- Hospital:
CREATE TABLE patients (id_patient INT...
CHECK (specialty IN ('Cardiología', 'Pediatría'))
```

---

### `sql/views.sql`
Cambia los nombres de tablas y columnas en los JOINs:
```sql
-- Nuestro proyecto:
FROM clients c
LEFT JOIN transactions t ON c.id_client = t.id_client

-- Hospital:
FROM patients p
LEFT JOIN appointments a ON p.id_patient = a.id_patient
```

---

### `sql/reset.sql`
Cambia los nombres de las tablas.
⚠️ El orden importa — siempre borra primero las tablas hijas:
```sql
-- Nuestro proyecto:         -- Hospital:
DELETE FROM validations;     DELETE FROM diagnoses;
DELETE FROM transactions;    DELETE FROM appointments;
DELETE FROM clients;         DELETE FROM patients;
DELETE FROM advisors;        DELETE FROM doctors;
DELETE FROM platforms;       DELETE FROM departments;
```

---

### `backend/uploads/source.xlsx`
Las columnas deben coincidir exactamente con lo que lee `migrationService.js`:
```
-- Nuestro proyecto:
client_name | client_email | client_phone | client_city |
advisor_name | advisor_role | advisor_channel | advisor_city |
platform_name | amount | date | status | score | result

-- Hospital:
patient_name | patient_email | patient_phone | patient_city |
doctor_name | doctor_role | doctor_specialty | doctor_city |
department_name | cost | date | status | rating | result
```

---

### `backend/repositories/migrationRepository.js`
Cambia nombres de funciones, tablas y columnas en cada INSERT:
```js
// Nuestro proyecto:
const insertClient = async (client) => {
  await sqlPool.execute(
    `INSERT IGNORE INTO clients (name, email, phone, city) VALUES (?, ?, ?, ?)`,
    [client.name, client.email, client.phone, client.city]
  );
};
module.exports = { insertClient, insertAdvisor, insertPlatform, insertTransaction, insertValidation };

// Hospital:
const insertPatient = async (patient) => {
  await sqlPool.execute(
    `INSERT IGNORE INTO patients (name, email, phone, city) VALUES (?, ?, ?, ?)`,
    [patient.name, patient.email, patient.phone, patient.city]
  );
};
module.exports = { insertPatient, insertDoctor, insertDepartment, insertAppointment, insertDiagnosis };
```

---

### `backend/services/migrationService.js`
Cambia los nombres de funciones importadas y los campos del Excel:
```js
// Nuestro proyecto:
const { insertClient, insertAdvisor, insertPlatform, insertTransaction, insertValidation }
  = require('../repositories/migrationRepository');

const id_client   = await insertClient({ name: row.client_name, email: row.client_email... });
const id_advisor  = await insertAdvisor({ name: row.advisor_name... });
const id_platform = await insertPlatform({ name: row.platform_name });

// Hospital:
const { insertPatient, insertDoctor, insertDepartment, insertAppointment, insertDiagnosis }
  = require('../repositories/migrationRepository');

const id_patient    = await insertPatient({ name: row.patient_name, email: row.patient_email... });
const id_doctor     = await insertDoctor({ name: row.doctor_name... });
const id_department = await insertDepartment({ name: row.department_name });
```

---

### `backend/repositories/clientRepository.js`
Renombra el archivo a `patientRepository.js` y cambia tabla y PK:
```js
// Nuestro proyecto:
await sqlPool.execute('SELECT * FROM clients');
await sqlPool.execute('SELECT * FROM clients WHERE id_client = ?', [id]);
await sqlPool.execute('INSERT INTO clients (name, email, phone, city) VALUES...);
await sqlPool.execute('UPDATE clients SET name=?... WHERE id_client=?'...);
await sqlPool.execute('DELETE FROM clients WHERE id_client = ?', [id]);

// Hospital → patientRepository.js:
await sqlPool.execute('SELECT * FROM patients');
await sqlPool.execute('SELECT * FROM patients WHERE id_patient = ?', [id]);
await sqlPool.execute('INSERT INTO patients (name, email, phone, city) VALUES...);
await sqlPool.execute('UPDATE patients SET name=?... WHERE id_patient=?'...);
await sqlPool.execute('DELETE FROM patients WHERE id_patient = ?', [id]);
```

---

### `backend/repositories/advisorRepository.js`
Renombra el archivo y cambia tabla, PK y el campo de filtro:
```js
// Nuestro proyecto:
const getAll = async (channel) => {
  if (channel) {
    const [rows] = await sqlPool.execute(
      'SELECT * FROM advisors WHERE channel = ?', [channel]
    );
    return rows;
  }
  const [rows] = await sqlPool.execute('SELECT * FROM advisors');
  return rows;
};

// Hospital → doctorRepository.js:
const getAll = async (specialty) => {
  if (specialty) {
    const [rows] = await sqlPool.execute(
      'SELECT * FROM doctors WHERE specialty = ?', [specialty]
    );
    return rows;
  }
  const [rows] = await sqlPool.execute('SELECT * FROM doctors');
  return rows;
};
```

---

### `backend/repositories/platformRepository.js`
Renombra el archivo y cambia la tabla y PK en todos los queries:
```js
// Nuestro proyecto:          // Hospital → departmentRepository.js:
'SELECT * FROM platforms'     'SELECT * FROM departments'
'WHERE id_platform = ?'       'WHERE id_department = ?'
'INSERT INTO platforms...'    'INSERT INTO departments...'
'UPDATE platforms SET...'     'UPDATE departments SET...'
'DELETE FROM platforms...'    'DELETE FROM departments...'
```

---

### `backend/repositories/reportRepository.js`
Cambia los nombres de tablas y columnas en cada query.
La lógica de los JOINs es idéntica, solo cambian los nombres:
```js
// Nuestro proyecto:
SELECT c.id_client, c.name, AVG(v.score) as avg_score
FROM clients c
INNER JOIN transactions t ON c.id_client = t.id_client
INNER JOIN validations v ON t.id_transaction = v.id_transaction
GROUP BY c.id_client, c.name

// Hospital:
SELECT p.id_patient, p.name, AVG(d.rating) as avg_rating
FROM patients p
INNER JOIN appointments a ON p.id_patient = a.id_patient
INNER JOIN diagnoses d ON a.id_appointment = d.id_appointment
GROUP BY p.id_patient, p.name
```

---

### `backend/controllers/clientController.js`
Renombra el archivo y cambia el require y los mensajes de error:
```js
// Nuestro proyecto:
const clientRepo = require('../repositories/clientRepository');
if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El email ya existe' });
if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'El cliente tiene transacciones' });

// Hospital → patientController.js:
const patientRepo = require('../repositories/patientRepository');
if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El email ya existe' });
if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'El paciente tiene citas' });
```

---

### `backend/controllers/advisorController.js`
Renombra el archivo y cambia el require y el campo de filtro:
```js
// Nuestro proyecto:
const advisorRepo = require('../repositories/advisorRepository');
const advisors = await advisorRepo.getAll(req.query.channel);

// Hospital → doctorController.js:
const doctorRepo = require('../repositories/doctorRepository');
const doctors = await doctorRepo.getAll(req.query.specialty);
```

---

### `backend/controllers/platformController.js`
Renombra el archivo y cambia el require y los mensajes:
```js
// Nuestro proyecto:
const platformRepo = require('../repositories/platformRepository');
if (!platform) return res.status(404).json({ error: 'Plataforma no encontrada' });

// Hospital → departmentController.js:
const departmentRepo = require('../repositories/departmentRepository');
if (!department) return res.status(404).json({ error: 'Departamento no encontrado' });
```

---

### `backend/routes/clientRoutes.js`
Renombra el archivo y cambia el require:
```js
// Nuestro proyecto:
const ctrl = require('../controllers/clientController');

// Hospital → patientRoutes.js:
const ctrl = require('../controllers/patientController');
```

---

### `backend/routes/advisorRoutes.js`
Renombra el archivo y cambia el require:
```js
// Nuestro proyecto:
const ctrl = require('../controllers/advisorController');

// Hospital → doctorRoutes.js:
const ctrl = require('../controllers/doctorController');
```

---

### `backend/routes/platformRoutes.js`
Renombra el archivo y cambia el require:
```js
// Nuestro proyecto:
const ctrl = require('../controllers/platformController');

// Hospital → departmentRoutes.js:
const ctrl = require('../controllers/departmentController');
```

---

### `backend/index.js`
Cambia los nombres de imports y rutas:
```js
// Nuestro proyecto:
const clientRoutes   = require('./routes/clientRoutes');
const advisorRoutes  = require('./routes/advisorRoutes');
const platformRoutes = require('./routes/platformRoutes');
app.use('/api/clients',   clientRoutes);
app.use('/api/advisors',  advisorRoutes);
app.use('/api/platforms', platformRoutes);

// Hospital:
const patientRoutes    = require('./routes/patientRoutes');
const doctorRoutes     = require('./routes/doctorRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
app.use('/api/patients',    patientRoutes);
app.use('/api/doctors',     doctorRoutes);
app.use('/api/departments', departmentRoutes);
```

---

### `backend/repositories/mongoRepository.js`
Cambia los campos del esquema y el nombre del modelo:
```js
// Nuestro proyecto:
const clientHistorySchema = new mongoose.Schema({
  id_client: Number,
  client_name: String,
  client_email: String,
  advisor_name: String,
  transactions: Array
});
const ClientHistory = mongoose.model('client_histories', clientHistorySchema);

// Hospital:
const patientHistorySchema = new mongoose.Schema({
  id_patient: Number,
  patient_name: String,
  patient_email: String,
  doctor_name: String,
  appointments: Array
});
const PatientHistory = mongoose.model('patient_histories', patientHistorySchema);
```

---

### `frontend/index.html`
Cambia los textos visibles y labels del formulario:
```html
<!-- Nuestro proyecto: -->
<h2>Clientes</h2>
<button onclick="showSection('clients')">Clientes</button>
<input placeholder="Nombre">
<input placeholder="Email">
<input placeholder="Teléfono">
<input placeholder="Ciudad">

<!-- Hospital: -->
<h2>Pacientes</h2>
<button onclick="showSection('patients')">Pacientes</button>
<input placeholder="Nombre">
<input placeholder="Email">
<input placeholder="Teléfono">
<input placeholder="Ciudad">
```

---

### `frontend/app.js`
Cambia las URLs de la API, los nombres de variables y los campos de la tabla:
```js
// Nuestro proyecto:
const clients = await fetch(`${API}/clients`).then(r => r.json());
document.getElementById('total-clients').textContent = clients.length;
tbody.innerHTML = clients.map(c => `
  <td>${c.id_client}</td><td>${c.name}</td>...
  <button onclick="editClient(${c.id_client}...)">

// Hospital:
const patients = await fetch(`${API}/patients`).then(r => r.json());
document.getElementById('total-patients').textContent = patients.length;
tbody.innerHTML = patients.map(p => `
  <td>${p.id_patient}</td><td>${p.name}</td>...
  <button onclick="editPatient(${p.id_patient}...)">
```

---

## Paso 5 — Archivos que son EXACTAMENTE IGUALES ✅

Estos archivos NO necesitas tocar nada:

| Archivo | Por qué es igual |
|---|---|
| `backend/config/db.js` | Solo maneja conexiones, no sabe del dominio |
| `backend/.env` | Solo variables de entorno |
| `backend/routes/migrationRoutes.js` | La ruta de migración siempre es la misma |
| `backend/controllers/migrationController.js` | Solo llama processMigration |
| `backend/controllers/mongoController.js` | Solo llama funciones de mongoRepository |
| `backend/routes/mongoRoutes.js` | Las rutas de feedback e history son iguales |
| `backend/routes/reportRoutes.js` | Las rutas son iguales, solo cambia el contenido |
| `backend/controllers/reportController.js` | La estructura es igual para cualquier dominio |
| `frontend/style.css` | Los estilos son universales |
| `package.json` raíz | Las dependencias son iguales |
| `package.json` backend | Las dependencias son iguales |

---

## Paso 6 — Checklist antes de arrancar

```
□ ¿Identifiqué mis 5 entidades?
□ ¿Creé el Excel con las columnas correctas?
□ ¿Ejecuté database.sql en MySQL?
  mysql -u root -p < sql/database.sql
□ ¿Ejecuté views.sql en MySQL?
  mysql -u root -p < sql/views.sql
□ ¿El .env tiene las credenciales correctas?
□ ¿MongoDB Compass está abierto y conectado?
□ ¿Instalé dependencias en /backend?
  npm install express cors multer xlsx mysql2 mongoose dotenv
  npm install --save-dev nodemon
□ ¿Los nombres del Excel coinciden exactamente con migrationService.js?
□ ¿Cambié todos los nombres en index.js?
□ ¿Hice commit antes de arrancar?
  git add . && git commit -m "proyecto adaptado"
```

---

## Paso 7 — Ejemplos de adaptación por dominio

### Hospital
```
patients    (id_patient, name, email, phone, birth_date)
doctors     (id_doctor, name, specialty, city)
departments (id_department, name)
appointments (id_appointment, id_patient, id_doctor, id_department, cost, date, status)
diagnoses   (id_diagnosis, id_appointment, severity, result, diagnosed_at)
```

### Escuela
```
students    (id_student, name, email, phone, grade_level)
teachers    (id_teacher, name, subject, modality, city)
courses     (id_course, name)
enrollments (id_enrollment, id_student, id_teacher, id_course, fee, date, status)
grades      (id_grade, id_enrollment, score, result, graded_at)
```

### Veterinaria
```
owners      (id_owner, name, email, phone, city)
vets        (id_vet, name, specialty, clinic, city)
services    (id_service, name)
visits      (id_visit, id_owner, id_vet, id_service, cost, date, status)
diagnoses   (id_diagnosis, id_visit, severity, result, diagnosed_at)
```

### Gimnasio
```
members     (id_member, name, email, phone, city)
trainers    (id_trainer, name, specialty, shift, city)
plans       (id_plan, name)
sessions    (id_session, id_member, id_trainer, id_plan, cost, date, status)
evaluations (id_evaluation, id_session, score, result, evaluated_at)
```

### Restaurante
```
customers   (id_customer, name, email, phone, city)
waiters     (id_waiter, name, shift, branch, city)
menus       (id_menu, name)
orders      (id_order, id_customer, id_waiter, id_menu, total, date, status)
reviews     (id_review, id_order, rating, result, reviewed_at)
```

---

## Resumen en 1 minuto

```
1. Leer enunciado → identificar 5 entidades
2. Definir campos de cada entidad
3. Crear source.xlsx con las columnas correctas
4. Ctrl+Shift+H en VSCode → reemplazar todos los nombres
5. Ejecutar database.sql y views.sql en MySQL
6. Verificar que migrationService.js use los mismos nombres que el Excel
7. npm start → migrar con Postman → probar endpoints
```