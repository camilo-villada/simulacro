// Repositorio con operaciones CRUD de plataformas.
const platformRepo = require('../repositories/platformRepository');

// Devuelve todas las plataformas registradas.
const getAll = async (req, res) => {
  try {
    const platforms = await platformRepo.getAll();
    res.status(200).json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Devuelve una plataforma por id.
const getById = async (req, res) => {
  try {
    const platform = await platformRepo.getById(req.params.id);
    if (!platform) return res.status(404).json({ error: 'Platform not found' });
    res.status(200).json(platform);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea una nueva plataforma.
const create = async (req, res) => {
  try {
    // Solo requiere nombre.
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = await platformRepo.create({ name });
    res.status(201).json({ id_platform: id, name });
  } catch (error) {
    // Conflicto por duplicado según restricción de BD.
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Platform already exists' });
    res.status(500).json({ error: error.message });
  }
};

// Actualiza nombre de plataforma por id.
const update = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const affected = await platformRepo.update(req.params.id, { name });
    if (!affected) return res.status(404).json({ error: 'Platform not found' });
    res.status(200).json({ message: 'Platform updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina una plataforma por id.
const remove = async (req, res) => {
  try {
    const affected = await platformRepo.remove(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Platform not found' });
    res.status(200).json({ message: 'Platform deleted successfully' });
  } catch (error) {
    // Evita eliminar si está relacionada con transacciones existentes.
    if (error.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Platform has transactions, cannot delete' });
    res.status(500).json({ error: error.message });
  }
};

// Exporta funciones del controlador.
module.exports = { getAll, getById, create, update, remove };