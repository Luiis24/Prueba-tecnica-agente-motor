async function openModal(idCliente) {
    const data = await getCliente(idCliente);
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modalBody').innerHTML = `<h2>${data.cliente.nombre}</h2>
        <p>Teléfono:${data.cliente.telefono}</p>
        <p>Correo:${data.cliente.correo}</p>
        <hr>
        <h3>Pólizas</h3>${data.polizas.map(poliza => 
            `<p>
                ${poliza.tipo_poliza} - ${poliza.fecha_vencimiento}
            </p>`).join('')}>`;
}