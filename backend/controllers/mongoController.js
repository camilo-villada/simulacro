// Repositorio para operaciones sobre colecciones en MongoDB.
const mongoRepo = require('../repositories/mongoRepository');

// Crea un documento de feedback enviado por un cliente.
const createFeedback = async (req, res) => {
  try {
    // Campos esperados en el body.
    const { id_client, client_email, comment, rating } = req.body;
    // Validación mínima para evitar documentos incompletos.
    if (!id_client || !client_email || !comment || !rating)
      return res.status(400).json({ error: 'All fields are required' });
    // Guarda el feedback en MongoDB.
    const data = await mongoRepo.createFeedback({ id_client, client_email, comment, rating });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Consulta feedback por id de cliente.
const getFeedbackByClient = async (req, res) => {
  try {
    // clientId llega como parámetro en la URL.
    const data = await mongoRepo.getFeedbackByClient(req.params.clientId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Recupera historial agregado del cliente por email.
const getClientHistory = async (req, res) => {
  try {
    const data = await mongoRepo.getClientHistory(req.params.email);
    // Si no existe historial, retorna 404.
    if (!data) return res.status(404).json({ error: 'History not found' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Exporta handlers para rutas Mongo.
module.exports = { createFeedback, getFeedbackByClient, getClientHistory };