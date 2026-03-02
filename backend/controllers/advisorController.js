// Repositorio con consultas relacionadas a asesores.
const advisorRepo = require('../repositories/advisorRepository');

// Lista asesores; puede filtrar por canal si llega query param.
const getAll = async (req, res) => {
  try {
    // req.query.channel se usa para filtrar por Nequi o Daviplata.
    const advisors = await advisorRepo.getAll(req.query.channel);
    res.status(200).json(advisors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtiene un asesor por id.
const getById = async (req, res) => {
  try {
    const advisor = await advisorRepo.getById(req.params.id);
    // Si no hay coincidencia, informa 404.
    if (!advisor) return res.status(404).json({ error: 'Advisor not found' });
    res.status(200).json(advisor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza los datos de un asesor.
const update = async (req, res) => {
  try {
    // Datos esperados para actualización completa.
    const { name, role, channel, city } = req.body;
    if (!name || !role || !channel || !city)
      return res.status(400).json({ error: 'All fields are required' });
    // affectedRows permite validar existencia del registro.
    const affected = await advisorRepo.update(req.params.id, { name, role, channel, city });
    if (!affected) return res.status(404).json({ error: 'Advisor not found' });
    res.status(200).json({ message: 'Advisor updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Exporta funciones del controlador.
module.exports = { getAll, getById, update };