// Importa Mongoose para definir esquemas y modelos de MongoDB.
const mongoose = require('mongoose');

// Esquema para historial agregado por cliente.
const clientHistorySchema = new mongoose.Schema({
  // id_client proviene de MySQL para trazabilidad entre motores.
  id_client: Number,
  client_name: String,
  client_email: String,
  advisor_name: String,
  // Arreglo de transacciones históricas del cliente.
  transactions: Array
});

// Modelo asociado a la colección client_histories.
const ClientHistory = mongoose.model('client_histories', clientHistorySchema);

// Crea o actualiza historial de cliente sin duplicar transacciones.
const upsertClientHistory = async (clientData) => {
  await ClientHistory.findOneAndUpdate(
    // Criterio de identidad por correo del cliente.
    { client_email: clientData.client_email },
    {
      // Actualiza datos de cabecera del cliente.
      $set: {
        id_client: clientData.id_client,
        client_name: clientData.client_name,
        client_email: clientData.client_email,
        advisor_name: clientData.advisor_name
      },
      // Inserta transacción solo si no existe (idempotencia).
      $addToSet: {
        transactions: clientData.transaction
      }
    },
    // upsert crea documento si no existe.
    { upsert: true, new: true }
  );
};

// Esquema para feedback de clientes.
const feedbackSchema = new mongoose.Schema({
  id_client: Number,
  client_email: String,
  comment: String,
  rating: Number,
  // Fecha de creación automática del documento.
  created_at: { type: Date, default: Date.now }
});

// Modelo asociado a la colección feedback.
const Feedback = mongoose.model('feedback', feedbackSchema);

// Crea un nuevo feedback.
const createFeedback = async (data) => {
  const feedback = new Feedback(data);
  return await feedback.save();
};

// Busca feedback por id de cliente.
const getFeedbackByClient = async (clientId) => {
  // Se convierte a Number para coincidir con tipo del esquema.
  return await Feedback.find({ id_client: Number(clientId) });
};

// Busca historial de cliente por correo.
const getClientHistory = async (email) => {
  return await ClientHistory.findOne({ client_email: email });
};

// Exporta funciones de acceso a MongoDB.
module.exports = { upsertClientHistory, createFeedback, getFeedbackByClient, getClientHistory };