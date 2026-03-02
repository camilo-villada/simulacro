-- Crea la base de datos principal si aún no existe.
CREATE DATABASE IF NOT EXISTS pd_camilo_villada_thompson;

-- Selecciona la base de datos para ejecutar el resto del script.
USE pd_camilo_villada_thompson;

-- Tabla de clientes.
-- Guarda datos de identificación y contacto.
CREATE TABLE clients (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL
);

-- Tabla de asesores.
-- El campo channel restringe valores a Nequi o Daviplata.
CREATE TABLE advisors (
    id_advisor INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('Nequi', 'Daviplata')),
    city VARCHAR(50) NOT NULL
);


-- Tabla de plataformas.
-- Catálogo de plataformas financieras soportadas.
CREATE TABLE platforms (
    id_platform INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);


-- Tabla de transacciones.
-- Relaciona cliente, asesor y plataforma con monto, fecha y estado.
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

-- Tabla de validaciones.
-- Almacena evaluación de cada transacción.
CREATE TABLE validations (
    id_validation INT AUTO_INCREMENT PRIMARY KEY,
    id_transaction INT NOT NULL,
    score DECIMAL (4,2) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('approved', 'rejected')),
    validated_at DATE NOT NULL,
    FOREIGN KEY (id_transaction) REFERENCES transactions(id_transaction)
);


-- Índices para optimizar búsquedas y joins frecuentes.
CREATE INDEX idx_transactions_client   ON transactions(id_client);
CREATE INDEX idx_transactions_advisor  ON transactions(id_advisor);
CREATE INDEX idx_transactions_platform ON transactions(id_platform);
CREATE INDEX idx_transactions_date     ON transactions(date);
CREATE INDEX idx_validations_score     ON validations(score);