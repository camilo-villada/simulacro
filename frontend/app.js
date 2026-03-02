// URL base de la API backend.
const API = 'http://localhost:3000/api';

// Muestra la sección solicitada y oculta las demás.
const showSection = (id) => {
  // Oculta todas las secciones.
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  // Muestra solo la sección activa.
  document.getElementById(id).classList.remove('hidden');
  // Carga datos al entrar a Dashboard.
  if (id === 'dashboard') loadDashboard();
  // Carga listado al entrar a Clients.
  if (id === 'clients') loadClients();
};

// ==================== DASHBOARD ====================
// Consulta métricas principales y las pinta en tarjetas.
const loadDashboard = async () => {
  // Obtiene clientes desde backend.
  const clients = await fetch(`${API}/clients`).then(r => r.json());
  // Obtiene plataformas desde backend.
  const platforms = await fetch(`${API}/platforms`).then(r => r.json());
  // Obtiene reporte de recaudo para un rango fijo de fechas.
  const revenue = await fetch(`${API}/reports/revenue?startDate=2024-01-01&endDate=2025-12-31`).then(r => r.json());

  // Actualiza valores visibles en el DOM.
  document.getElementById('total-clients').textContent = clients.length;
  document.getElementById('total-platforms').textContent = platforms.length;
  // Formatea el número con separadores de miles.
  document.getElementById('total-revenue').textContent = '$' + Number(revenue.total_revenue).toLocaleString();
};

// ==================== CLIENTS ====================
// Carga la tabla de clientes.
const loadClients = async () => {
  const clients = await fetch(`${API}/clients`).then(r => r.json());
  const tbody = document.getElementById('clients-table');
  // Construye filas HTML a partir de los datos.
  tbody.innerHTML = clients.map(c => `
    <tr>
      <td>${c.id_client}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.city}</td>
      <td>
        <button class="btn-edit" onclick="editClient(${c.id_client}, '${c.name}', '${c.email}', '${c.phone}', '${c.city}')">Edit</button>
        <button class="btn-delete" onclick="deleteClient(${c.id_client})">Delete</button>
      </td>
    </tr>
  `).join('');
};

// Pasa los datos de un cliente al formulario para edición.
const editClient = (id, name, email, phone, city) => {
  document.getElementById('client-id').value = id;
  document.getElementById('client-name').value = name;
  document.getElementById('client-email').value = email;
  document.getElementById('client-phone').value = phone;
  document.getElementById('client-city').value = city;
};

// Limpia el formulario y elimina el id oculto.
const resetForm = () => {
  document.getElementById('client-form').reset();
  document.getElementById('client-id').value = '';
};

// Elimina cliente previa confirmación del usuario.
const deleteClient = async (id) => {
  if (!confirm('Are you sure?')) return;
  // Llama endpoint DELETE del backend.
  await fetch(`${API}/clients/${id}`, { method: 'DELETE' });
  // Refresca la tabla después de borrar.
  loadClients();
};

// Maneja envío del formulario (crear o editar).
document.getElementById('client-form').addEventListener('submit', async (e) => {
  // Evita recargar la página por comportamiento por defecto del form.
  e.preventDefault();
  // Si hay id, se trata de edición; si no, creación.
  const id = document.getElementById('client-id').value;
  // Construye payload JSON con valores del formulario.
  const body = {
    name: document.getElementById('client-name').value,
    email: document.getElementById('client-email').value,
    phone: document.getElementById('client-phone').value,
    city: document.getElementById('client-city').value
  };

  // Ruta de actualización.
  if (id) {
    await fetch(`${API}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } else {
    // Ruta de creación.
    await fetch(`${API}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  // Restablece formulario y recarga lista para reflejar cambios.
  resetForm();
  loadClients();
});

// ==================== REPORTS ====================
// Consulta un reporte por tipo y lo renderiza en formato JSON.
const loadReport = async (type) => {
  const data = await fetch(`${API}/reports/${type}`).then(r => r.json());
  const div = document.getElementById('report-result');
  // Uso de <pre> para conservar formato legible del JSON.
  div.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
};

// Carga inicial del dashboard al abrir la app.
loadDashboard();