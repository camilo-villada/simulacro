# ExpertSoft Fintech

## 1. Descripción general del sistema y su propósito

**ExpertSoft Fintech** es un sistema fullstack que centraliza datos financieros provenientes de **Nequi** y **Daviplata** para el sector eléctrico colombiano.  
Su propósito es consolidar operaciones transaccionales en una base relacional (MySQL), complementar el historial de cliente en una base documental (MongoDB) y exponer funcionalidades mediante una API REST en Node.js + Express, con una interfaz web en HTML/CSS/JavaScript vanilla.

---

## 2. Requisitos previos

Antes de ejecutar el proyecto, instala lo siguiente:

- **Node.js v18 o superior**: https://nodejs.org/en/download
- **MySQL 8.0**: https://dev.mysql.com/downloads/mysql/
- **MongoDB Community Server 8.0**: https://www.mongodb.com/try/download/community
- **MongoDB Compass**: https://www.mongodb.com/try/download/compass
- **Postman**: https://www.postman.com/downloads/
- **Git**: https://git-scm.com/downloads

---

## 3. Cómo instalar dependencias

Este proyecto tiene **DOS** archivos `package.json`: uno en la raíz y otro en `backend`.

### En la carpeta raíz del proyecto

Ejecuta:

```bash
npm install
```

En la raíz se instala únicamente:

- `concurrently`: permite arrancar backend y frontend con un solo comando.

### En la carpeta `/backend`

Ejecuta:

```bash
cd backend && npm install
```

Dependencias de producción instaladas en backend:

- `express`: servidor web y enrutamiento
- `cors`: habilita peticiones desde el frontend
- `multer`: carga de archivos (Excel/CSV)
- `xlsx`: lectura de archivos de Excel
- `mysql2`: conexión a MySQL
- `mongoose`: conexión y modelado en MongoDB
- `dotenv`: carga de variables de entorno

Dependencia de desarrollo:

- `nodemon`: reinicio automático del servidor al guardar cambios

### En la carpeta `/frontend`

No requiere `npm install`.  
Solo necesitas servir archivos estáticos con:

```bash
npx serve .
```

`npx serve` se instala automáticamente la primera vez que se ejecuta.

---

## 4. Configuración de MySQL paso a paso

### 4.1 Instalar MySQL en Windows

1. Descarga MySQL 8.0 desde el sitio oficial.
2. Durante instalación, define contraseña para usuario `root`.
3. Finaliza el asistente manteniendo el servicio de MySQL habilitado.

### 4.2 Verificar que MySQL está corriendo

En Windows, puedes validar desde **Servicios** o en terminal:

```bash
mysql --version
```

### 4.3 Acceder a MySQL desde terminal

```bash
mysql -u root -p
```

### 4.4 Ejecutar script principal de base de datos

Desde la raíz del proyecto:

```bash
mysql -u root -p < sql/database.sql
```

### 4.5 Verificar creación de tablas

Dentro de la consola MySQL:

```sql
USE pd_camilo_villada_thompson;
SHOW TABLES;
```

### 4.6 Ejecutar vistas SQL

Desde la raíz del proyecto:

```bash
mysql -u root -p < sql/views.sql
```

### 4.7 Archivo `reset.sql` y cuándo usarlo

El archivo `sql/reset.sql`:

- elimina datos de tablas de negocio
- reinicia contadores `AUTO_INCREMENT`

Úsalo cuando necesites volver a un estado limpio para repetir pruebas o migraciones.

---

## 5. Configuración de MongoDB paso a paso

### 5.1 Instalar MongoDB Community Server en Windows

1. Descarga MongoDB Community Server 8.0.
2. Durante instalación, marca la opción **Install MongoD as a Service**.
3. Finaliza instalación.

### 5.2 Abrir MongoDB Compass

Inicia **MongoDB Compass** desde el menú de inicio.

### 5.3 Crear conexión en Compass

Configura una conexión nueva con URI:

```text
mongodb://localhost:27017
```

### 5.4 Verificar servicio MongoDB

En PowerShell **como administrador**:

```powershell
net start MongoDB
```

Si ya está iniciado, Windows lo indicará en la salida.

### 5.5 Creación automática de la base de datos

La base de datos Mongo se crea automáticamente al ejecutar la migración por primera vez, usando la URI configurada en `.env`.

---

## 6. Configuración del archivo `.env`

Crea el archivo `.env` dentro de `/backend` con el siguiente contenido:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=pd_camilo_villada_thompson
MONGO_URI=mongodb://localhost:27017/pd_camilo_villada_thompson
```

Explicación de variables:

- `PORT`: puerto HTTP del backend Express.
- `DB_HOST`: host de MySQL.
- `DB_USER`: usuario de MySQL.
- `DB_PASSWORD`: contraseña del usuario MySQL.
- `DB_NAME`: nombre de la base de datos relacional.
- `MONGO_URI`: cadena de conexión a MongoDB y nombre de base documental.

---

## 7. Cómo arrancar el proyecto

1. Asegúrate de que **MySQL** esté corriendo.
2. Abre **MongoDB Compass** y conéctate a `localhost:27017`.
3. Desde la carpeta raíz del proyecto ejecuta:

```bash
npm start
```

`npm start` levanta:

- backend en el puerto `3000`
- frontend en otro puerto servido por `serve`

La URL del frontend aparece en la terminal cuando inicia el servidor estático.

---

## 8. Cómo hacer la migración de datos con Postman

1. Abre Postman.
2. Crea un request **POST** a:

```text
http://localhost:3000/api/migration/upload
```

3. En **Body** selecciona `form-data`.
4. Agrega:
	 - **Key**: `file`
	 - **Type**: `File`
	 - **Value**: selecciona `source.xlsx`
5. Haz clic en **Send**.
6. Verifica una respuesta de este tipo:

```json
{"message":"Migration completed","success":10,"errors":[]}
```

### Idempotencia de la migración

La migración es idempotente (usa `INSERT IGNORE` y lógica de recuperación de IDs), por lo que puede ejecutarse varias veces sin duplicar datos ya existentes.

---

## 9. Lista completa de endpoints disponibles organizados por categoría

### CLIENTS

- `GET /api/clients`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/clients/:email/history` (MongoDB)

### ADVISORS

- `GET /api/advisors`
- `GET /api/advisors?channel=Nequi`
- `GET /api/advisors/:id`
- `PUT /api/advisors/:id`

### PLATFORMS

- `GET /api/platforms`
- `POST /api/platforms`
- `PUT /api/platforms/:id`
- `DELETE /api/platforms/:id`

### REPORTS

- `GET /api/reports/top-clients`
- `GET /api/reports/platforms-by-transactions`
- `GET /api/reports/clients-without-validations`
- `GET /api/reports/avg-amount-by-platform`
- `GET /api/reports/transactions-by-date?startDate=2024-01-01&endDate=2024-12-31`
- `GET /api/reports/clients-more-than-3`
- `GET /api/reports/empty-platforms`
- `GET /api/reports/ranking`
- `GET /api/reports/last-transaction-by-platform`
- `GET /api/reports/worst-client`
- `GET /api/reports/revenue?startDate=2024-01-01&endDate=2024-12-31`
- `GET /api/reports/client-performance` (vista SQL)
- `GET /api/reports/platform-stats` (vista SQL)

### MONGODB

- `POST /api/feedback`
- `GET /api/feedback/:clientId`

### MIGRATION

- `POST /api/migration/upload`

---

## 10. Explicación de la normalización con ejemplo

### 10.1 Tabla original sin normalizar (ejemplo conceptual)

| id | client_name | client_email | advisor_name | advisor_channel | platform_name | amount | score | result | date |
|---:|---|---|---|---|---|---:|---:|---|---|
| 1 | Ana Ruiz | ana@correo.com | Carlos Rojas | Nequi | Nequi App | 150000 | 92 | approved | 2024-02-01 |

En una sola tabla se mezclan datos de cliente, asesor, plataforma, transacción y validación.

### 10.2 Primera Forma Normal (1FN)

- Se definen claves primarias.
- Se garantizan valores atómicos (sin listas o campos compuestos).
- Cada fila representa un registro único.

### 10.3 Segunda Forma Normal (2FN)

Se separan entidades principales en tablas propias:

- `clients`
- `advisors`
- `platforms`

Así se evita duplicar información descriptiva en cada transacción.

### 10.4 Tercera Forma Normal (3FN)

- Se separa `validations` de `transactions`.
- Se eliminan dependencias transitivas.
- Cada tabla mantiene atributos que dependen de su clave primaria.

---

## 11. Explicación de las consultas avanzadas más importantes

### Top 5 clientes

Usa `INNER JOIN` entre clientes, transacciones y validaciones, calcula `AVG(score)`, agrupa con `GROUP BY`, ordena con `ORDER BY` y limita con `LIMIT 5`.

### Clientes sin validaciones

Usa `LEFT JOIN` y filtro `WHERE ... IS NULL` para encontrar clientes/transacciones sin registros de validación.

### Clientes con más de 3 transacciones

Usa agregación por cliente y `HAVING` para filtrar resultados agrupados (`COUNT(...) > 3`).

### Última transacción por plataforma

Usa subconsulta con `MAX(date)` por plataforma para obtener el registro más reciente.

### Reporte de recaudo

Combina múltiples queries: recaudo total, recaudo por plataforma y recaudo en rango de fechas.

---

## 12. Captura del modelo relacional

La captura del modelo relacional (DER) está en:

- `/docs/DER.png`

---

## 13. Decisiones técnicas tomadas

- **SQL para transacciones**: garantiza consistencia e integridad referencial mediante llaves foráneas.
- **MongoDB para historial**: permite lecturas rápidas de historial consolidado sin `JOIN` costosos.
- **Arquitectura por capas**: separación en `routes/controllers/repositories` facilita mantenimiento y escalabilidad.
- **Migración idempotente**: el uso de `INSERT IGNORE` permite re-ejecutar procesos sin duplicar datos.
- **Sin ORMs**: se utilizaron consultas directas como requisito del proyecto.

---

## 14. Datos del desarrollador

- **Nombre**: Camilo Villada Thompson
- **Proyecto**: ExpertSoft Fintech - Módulo 4 Bases de Datos Fullstack

---

## Estructura del proyecto

```text
/proyecto
	/backend
		/config (db.js - conexiones MySQL y MongoDB)
		/controllers (clientController, advisorController, platformController, reportController, migrationController, mongoController)
		/repositories (clientRepository, advisorRepository, platformRepository, reportRepository, migrationRepository, mongoRepository)
		/routes (clientRoutes, advisorRoutes, platformRoutes, reportRoutes, migrationRoutes, mongoRoutes)
		/uploads (source.xlsx, source.csv)
		index.js
		.env
		package.json
	/frontend
		index.html
		style.css
		app.js
	/sql
		database.sql
		views.sql
		reset.sql
	/mongo
		collections.json
	/docs
		DER.png
		normalization.md
	README.md
	package.json
```

---

## Datos del proyecto

- **Nombre**: ExpertSoft Fintech
- **Descripción**: Sistema que centraliza datos financieros de Nequi y Daviplata para el sector eléctrico colombiano
- **Desarrollador**: Camilo Villada Thompson
- **Stack**: Node.js + Express + MySQL + MongoDB + HTML + CSS + JS vanilla
