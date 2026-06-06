// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Clientes API
async function getClientes() {
    const response = await fetch(`${API_BASE}/polizas`);
    if (!response.ok) throw new Error('Error al obtener clientes');
    return response.json();
}

async function getTiposPoliza() {
    const response = await fetch(`${API_BASE}/tipos-poliza`);
    if (!response.ok) throw new Error('Error al obtener tipos de póliza');
    return response.json();
}

async function getPolizas() {
    const response = await fetch(`${API_BASE}/polizas`);
    if (!response.ok) throw new Error('Error al obtener pólizas');
    return response.json();
}

async function getCliente(idCliente) {
    const response = await fetch(`${API_BASE}/clientes/${idCliente}`);
    if (!response.ok) throw new Error('Error al obtener cliente');
    return response.json();
}

async function createCliente(clienteData) {
    const response = await fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData)
    });
    return response.json();
}

async function createPoliza(polizaData) {
    const response = await fetch(`${API_BASE}/polizas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(polizaData)
    });
    return response.json();
}

async function createGestion(gestionData) {
    const response = await fetch(`${API_BASE}/gestiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gestionData)
    });
    return response.json();
}

async function updatePolizaFecha(idPoliza, fechaVencimiento, gestionada = false) {
    const response = await fetch(`${API_BASE}/polizas/${idPoliza}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            fecha_vencimiento: fechaVencimiento,
            gestionada: gestionada ? 1 : undefined
        })
    });
    return response.json();
}
