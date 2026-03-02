-- Selecciona la base de datos objetivo.
USE pd_camilo_villada_thompson;

-- Vista de desempeño de clientes.
-- Resume transacciones, monto total y score promedio por cliente.
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

-- Vista de estadísticas por plataforma.
-- Resume cantidad de transacciones, monto total y monto promedio.
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