// Repositorio con operaciones SQL de clientes.
const clientRepo = require('../repositories/clientRepository');

// Obtiene todos los clientes.
const getAll = async (req, res) => {
  try {
    // Consulta la tabla clients.
    const clients = await clientRepo.getAll();
    // Responde con estado 200 y lista de clientes.
    res.status(200).json(clients);
  } catch (error) {
    // Error inesperado del servidor.
    res.status(500).json({ error: error.message });
  }
};

// Obtiene un cliente por su id.
const getById = async (req, res) => {
  try {
    // Toma el id desde los parámetros de la ruta.
    const client = await clientRepo.getById(req.params.id);
    // Si no existe, devuelve 404.
    if (!client) return res.status(404).json({ error: 'Client not found' });
    // Si existe, retorna el objeto cliente.
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo cliente.
const create = async (req, res) => {
  try {
    // Extrae campos del body enviados por el frontend o cliente API.
    const { name, email, phone, city } = req.body;
    // Validación básica: todos los campos son obligatorios.
    if (!name || !email || !phone || !city)
      return res.status(400).json({ error: 'All fields are required' });
    // Inserta el cliente y recibe su id generado.
    const id = await clientRepo.create({ name, email, phone, city });
    // Responde con 201 (creado) y los datos persistidos.
    res.status(201).json({ id_client: id, name, email, phone, city });
  } catch (error) {
    // Manejo específico de email duplicado por restricción UNIQUE.
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un cliente existente por id.
const update = async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;
    // Requiere todos los campos para mantener registro completo.
    if (!name || !email || !phone || !city)
      return res.status(400).json({ error: 'All fields are required' });
    // affected indica cuántas filas fueron afectadas.
    const affected = await clientRepo.update(req.params.id, { name, email, phone, city });
    // Si no afecta filas, el cliente no existe.
    if (!affected) return res.status(404).json({ error: 'Client not found' });
    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina un cliente por id.
const remove = async (req, res) => {
  try {
    const affected = await clientRepo.remove(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Client not found' });
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    // Error por integridad referencial: no se puede borrar si tiene transacciones asociadas.
    if (error.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Client has transactions, cannot delete' });
    res.status(500).json({ error: error.message });
  }
};

// Exporta las funciones para usarlas en las rutas.
module.exports = { getAll, getById, create, update, remove };