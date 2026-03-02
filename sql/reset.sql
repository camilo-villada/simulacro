-- Selecciona la base de datos donde se hará el reinicio.
USE pd_camilo_villada_thompson;

-- Limpia datos respetando orden por llaves foráneas (de tablas hijas a padres).
DELETE FROM validations;
DELETE FROM transactions;
DELETE FROM clients;
DELETE FROM advisors;
DELETE FROM platforms;

-- Reinicia los contadores AUTO_INCREMENT para comenzar desde 1.
ALTER TABLE clients AUTO_INCREMENT = 1;
ALTER TABLE advisors AUTO_INCREMENT = 1;
ALTER TABLE platforms AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE validations AUTO_INCREMENT = 1;