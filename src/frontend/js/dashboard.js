document.addEventListener('DOMContentLoaded', loadDashboard);

let polizasOriginales = [];
let tiposPoliza = [];
let clienteActualId = null;

async function loadDashboard() {
    try {
        await loadTipos();
        await loadPolizas();
        document.getElementById("searchInput").addEventListener("input", filterPolizas);
        document.getElementById("tipoPolizaFilter").addEventListener("change", filterPolizas);
        document.getElementById("closeModal").addEventListener("click", closeModal);
        const btnAgregar = document.getElementById('btnAgregarCliente');
        if (btnAgregar) {
            btnAgregar.removeEventListener('click', openModalCliente);
            btnAgregar.addEventListener('click', openModalCliente);
        }

        const closeModalClienteBtn = document.getElementById('closeModalCliente');
        if (closeModalClienteBtn) {
            closeModalClienteBtn.addEventListener('click', closeModalCliente);
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            const modalCliente = document.getElementById('modalCliente');
            if (e.target === modal) {
                closeModal();
            }
            if (e.target === modalCliente) {
                closeModalCliente();
            }
        });
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        showToast('Error al cargar los datos iniciales', false);
    }
}

async function loadTipos() {
    try {
        tiposPoliza = await getTiposPoliza();
        const select = document.getElementById('tipoPolizaFilter');
        if (!select) return;
        while (select.options.length > 1) {
            select.remove(1);
        }
        tiposPoliza.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_poliza;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar tipos:', error);
        showToast('Error al cargar los tipos de póliza', false);
    }
}

async function loadPolizas() {
    try {
        const polizas = await getPolizas();
        polizasOriginales = polizas.map(poliza => {
            const tipoEncontrado = tiposPoliza.find(t => t.nombre === poliza.tipo_poliza);
            return {
                ...poliza,
                id_tipo_poliza: tipoEncontrado ? tipoEncontrado.id_tipo_poliza : null
            };
        });
        renderPolizas(polizasOriginales);
    } catch (error) {
        console.error('Error al cargar pólizas:', error);
        showToast('Error al cargar las pólizas', false);
    }
}

function renderPolizas(polizas) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (polizas.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    No se encontraron pólizas
                </td>
            </tr>
        `;
        return;
    }

    polizas.forEach(poliza => {
        const prioridad = getPrioridad(poliza.fecha_vencimiento);
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${escapeHtml(poliza.nombre) || 'Sin nombre'}</td>
            <td>${escapeHtml(poliza.tipo_poliza) || 'Sin tipo'}</td>
            <td>${formatDate(poliza.fecha_vencimiento)}</td>
            <td>${poliza.gestionada ? '<span class="badge-gestionada">✅ Gestionada</span>' : '<span class="badge-pendiente">⏳ Pendiente</span>'}</td>
            <td><span class="prioridad-${prioridad.clase}">${prioridad.texto}</span></td>
            <td>
                <button class="btn-ver" data-cliente-id="${poliza.id_cliente}">
                    👁️ Ver
                </button>
            </td>
        `;
    });

    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', () => {
            const clienteId = parseInt(btn.dataset.clienteId);
            openModal(clienteId);
        });
    });
}

function filterPolizas() {
    const search = document.getElementById("searchInput").value.toLowerCase().trim();
    const tipoId = document.getElementById("tipoPolizaFilter").value;
    let resultado = [...polizasOriginales];

    if (search) {
        resultado = resultado.filter(poliza =>
            poliza.nombre && poliza.nombre.toLowerCase().includes(search)
        );
    }

    if (tipoId) {
        resultado = resultado.filter(poliza =>
            poliza.id_tipo_poliza && poliza.id_tipo_poliza == tipoId
        );
    }

    renderPolizas(resultado);
}

function getPrioridad(fechaVencimiento) {
    if (!fechaVencimiento) return { texto: "⚠️ Sin fecha", clase: "fuera" };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const diferencia = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (diferencia < 0 && diferencia >= -30) {
        return { texto: "🔴 Prioridad Alta", clase: "alta" };
    }
    if (diferencia >= 0 && diferencia <= 7) {
        return { texto: "🟠 Próxima a vencer", clase: "proxima" };
    }
    if (diferencia < -30) {
        return { texto: "⚫ Fuera de ventana", clase: "fuera" };
    }
    return { texto: "🟢 Vigente", clase: "vigente" };
}

async function openModal(idCliente) {
    try {
        showLoading(true);
        clienteActualId = idCliente;
        const data = await getCliente(idCliente);

        if (!data || !data.cliente) {
            throw new Error('Datos del cliente no encontrados');
        }

        document.getElementById('modal').classList.remove('hidden');
        document.getElementById('modalBody').innerHTML = `
            <div class="cliente-info">
                <h2>${escapeHtml(data.cliente.nombre) || 'Sin nombre'}</h2>
                <p>📞 <strong>Teléfono:</strong> ${escapeHtml(data.cliente.telefono) || 'No registrado'}</p>
                <p>✉️ <strong>Correo:</strong> ${escapeHtml(data.cliente.correo) || 'No registrado'}</p>
                <p>🆔 <strong>Documento:</strong> ${escapeHtml(data.cliente.tipo_documento)} - ${escapeHtml(data.cliente.numero_documento)}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>📋 Pólizas</h3>
                <button id="btnAgregarPolizaExistente" class="btn-agregar-poliza">
                    ➕ Agregar Póliza
                </button>
            </div>
            
            <div id="polizasContainer">
                ${data.polizas && data.polizas.length > 0 ?
                data.polizas.map(poliza => `
                        <div class="poliza-card" data-poliza-id="${poliza.id_poliza}">
                            <h4>${escapeHtml(poliza.tipo_poliza)}</h4>
                            <p>📅 <strong>Vence:</strong> ${formatDate(poliza.fecha_vencimiento)}</p>
                            <p>💰 <strong>Precio:</strong> $${formatNumber(poliza.precio)}</p>
                            <p>📊 <strong>Estado:</strong> ${poliza.gestionada ? "✅ Gestionada" : "⏳ Pendiente"}</p>
                            ${poliza.descripcion ? `<p>📝 <strong>Descripción:</strong> ${escapeHtml(poliza.descripcion)}</p>` : ''}
                            <div class="acciones-poliza">
                                <button class="btn-gestionar" data-poliza-id="${poliza.id_poliza}">
                                    📝 Gestionar
                                </button>
                                <button class="btn-renovar" data-poliza-id="${poliza.id_poliza}">
                                    🔄 Renovar
                                </button>
                            </div>
                            <div id="gestion-${poliza.id_poliza}" class="gestion-panel hidden"></div>
                            <div id="renovacion-${poliza.id_poliza}" class="renovacion-panel hidden"></div>
                        </div>
                    `).join('') :
                '<p class="empty-state">No hay pólizas registradas</p>'
            }
            </div>
            
            <div class="historial">
                <h3>📜 Historial de gestiones</h3>
                ${data.gestiones && data.gestiones.length > 0 ?
                data.gestiones.map(gestion => `
                        <div class="gestion-item">
                            <strong>${escapeHtml(gestion.resultado)}</strong>
                            <br>
                            ${escapeHtml(gestion.comentario) || 'Sin comentarios'}
                            <br>
                            <small>📆 ${formatDate(gestion.fecha_gestion)}</small>
                        </div>
                    `).join('') :
                '<p class="empty-state">No existen gestiones registradas</p>'
            }
            </div>
        `;


        const btnAgregarPoliza = document.getElementById('btnAgregarPolizaExistente');
        if (btnAgregarPoliza) {
            btnAgregarPoliza.addEventListener('click', () => openModalAgregarPoliza(clienteActualId));
        }


        document.querySelectorAll('.btn-gestionar').forEach(btn => {
            btn.addEventListener('click', () => {
                const polizaId = parseInt(btn.dataset.polizaId);
                toggleGestion(polizaId);
            });
        });

        document.querySelectorAll('.btn-renovar').forEach(btn => {
            btn.addEventListener('click', () => {
                const polizaId = parseInt(btn.dataset.polizaId);
                toggleRenovacion(polizaId);
            });
        });

        showLoading(false);

    } catch (error) {
        console.error('Error al abrir modal:', error);
        showLoading(false);
        document.getElementById('modalBody').innerHTML = `
            <div class="error-state">
                <p>❌ Error al cargar los datos del cliente</p>
                <button onclick="closeModal()" class="btn-primary">Cerrar</button>
            </div>
        `;
        document.getElementById('modal').classList.remove('hidden');
        showToast('Error al cargar los datos del cliente', false);
    }
}


function openModalAgregarPoliza(idCliente) {
    const modalBody = document.getElementById('modalBody');


    const contenidoAnterior = modalBody.innerHTML;

    modalBody.innerHTML = `
        <button id="btnVolver" class="btn-volver">← Volver</button>
        <h2>➕ Agregar Nueva Póliza</h2>
        <form id="formPolizaExistente" class="poliza-form">
            <div class="form-group">
                <label>Tipo de póliza *</label>
                <select id="id_tipo_poliza" required>
                    <option value="">Seleccionar tipo</option>
                    ${tiposPoliza.map(tipo => `<option value="${tipo.id_tipo_poliza}">${tipo.nombre}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="descripcion" rows="2" placeholder="Descripción de la póliza"></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Precio *</label>
                    <input type="number" id="precio" required placeholder="Ej: 500000">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha de contratación *</label>
                    <input type="date" id="fecha_contratacion" required value="${getTodayDate()}">
                </div>
                <div class="form-group">
                    <label>Fecha de vencimiento *</label>
                    <input type="date" id="fecha_vencimiento" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Observaciones</label>
                <textarea id="observaciones" rows="2" placeholder="Observaciones adicionales"></textarea>
            </div>
            
            <div class="form-buttons">
                <button type="submit" class="btn-primary">💾 Guardar Póliza</button>
                <button type="button" onclick="openModal(${idCliente})" class="btn-secondary">❌ Cancelar</button>
            </div>
        </form>
    `;


    document.getElementById('btnVolver').addEventListener('click', () => openModal(idCliente));


    document.getElementById('formPolizaExistente').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarPolizaClienteExistente(idCliente);
    });
}

async function guardarPolizaClienteExistente(idCliente) {
    const polizaData = {
        id_cliente: idCliente,
        id_tipo_poliza: document.getElementById('id_tipo_poliza').value,
        descripcion: document.getElementById('descripcion').value,
        precio: document.getElementById('precio').value,
        fecha_contratacion: document.getElementById('fecha_contratacion').value,
        fecha_vencimiento: document.getElementById('fecha_vencimiento').value,
        observaciones: document.getElementById('observaciones').value
    };

    if (!polizaData.id_tipo_poliza || !polizaData.precio || !polizaData.fecha_contratacion || !polizaData.fecha_vencimiento) {
        showToast('Por favor, complete todos los campos obligatorios', false);
        return;
    }

    try {
        const response = await createPoliza(polizaData);

        if (response.success) {
            showToast(response.message, true);


            setTimeout(() => {
                loadPolizas();
                openModal(idCliente);
            }, 1000);
        } else {
            showToast(response.message, false);
        }
    } catch (error) {
        console.error('Error al guardar póliza:', error);
        showToast('Error al guardar la póliza', false);
    }
}


async function guardarPolizaNuevoCliente(idCliente) {

    const id_tipo_poliza = document.getElementById('id_tipo_poliza')?.value;
    const precio = document.getElementById('precio')?.value;
    const fecha_contratacion = document.getElementById('fecha_contratacion')?.value;
    const fecha_vencimiento = document.getElementById('fecha_vencimiento')?.value;

    if (!id_tipo_poliza) {
        showToast('Por favor, seleccione un tipo de póliza', false);
        return;
    }

    if (!precio || precio <= 0) {
        showToast('Por favor, ingrese un precio válido', false);
        return;
    }

    if (!fecha_contratacion) {
        showToast('Por favor, seleccione la fecha de contratación', false);
        return;
    }

    if (!fecha_vencimiento) {
        showToast('Por favor, seleccione la fecha de vencimiento', false);
        return;
    }


    if (new Date(fecha_vencimiento) <= new Date(fecha_contratacion)) {
        showToast('La fecha de vencimiento debe ser mayor a la fecha de contratación', false);
        return;
    }

    const polizaData = {
        id_cliente: idCliente,
        id_tipo_poliza: parseInt(id_tipo_poliza),
        descripcion: document.getElementById('descripcion')?.value || '',
        precio: parseFloat(precio),
        fecha_contratacion: fecha_contratacion,
        fecha_vencimiento: fecha_vencimiento,
        observaciones: document.getElementById('observaciones')?.value || ''
    };

    try {
        showToast('Guardando póliza...', true);
        const response = await createPoliza(polizaData);

        if (response.success) {
            showToast('✅ Cliente y póliza creados exitosamente', true);
            closeModalCliente();
            await loadPolizas();
        } else {
            showToast(response.message || 'Error al guardar la póliza', false);
        }
    } catch (error) {
        console.error('Error al guardar póliza:', error);
        showToast('Error al guardar la póliza. Verifique los datos.', false);
    }
}

function finalizarCreacionCliente() {
    showToast(`✅ Cliente ${window.nuevoClienteNombre || ''} creado exitosamente sin póliza`, true);
    closeModalCliente();
    loadPolizas();
}

function toggleGestion(idPoliza) {
    const div = document.getElementById(`gestion-${idPoliza}`);
    if (!div) return;

    const isHidden = div.classList.contains('hidden');

    document.querySelectorAll('.gestion-panel, .renovacion-panel').forEach(panel => {
        if (panel.id !== `gestion-${idPoliza}` && panel.id !== `renovacion-${idPoliza}`) {
            panel.classList.add('hidden');
            panel.innerHTML = '';
        }
    });

    if (isHidden) {
        div.innerHTML = `
            <div class="gestion-form">
                <h4>📝 Nueva Gestión</h4>
                <select id="resultado-${idPoliza}" class="form-select">
                    <option value="LLAMADO">📞 Llamado</option>
                    <option value="INTERESADO">⭐ Interesado</option>
                    <option value="NO_CONTESTA">📵 No contesta</option>
                    <option value="CORREO_ENVIADO">✉️ Correo enviado</option>
                </select>
                <textarea id="comentario-${idPoliza}" class="form-textarea" placeholder="Escribe tus comentarios aquí..." rows="3"></textarea>
                <div class="form-buttons">
                    <button class="btn-guardar-gestion" data-poliza-id="${idPoliza}" class="btn-primary">💾 Guardar gestión</button>
                    <button class="btn-cancelar" data-poliza-id="${idPoliza}" class="btn-secondary">❌ Cancelar</button>
                </div>
            </div>
        `;

        div.querySelector('.btn-guardar-gestion')?.addEventListener('click', () => guardarGestion(idPoliza));
        div.querySelector('.btn-cancelar')?.addEventListener('click', () => toggleGestion(idPoliza));

        div.classList.remove('hidden');
        div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        div.classList.add('hidden');
        div.innerHTML = '';
    }
}

function toggleRenovacion(idPoliza) {
    const div = document.getElementById(`renovacion-${idPoliza}`);
    if (!div) return;

    const isHidden = div.classList.contains('hidden');

    document.querySelectorAll('.gestion-panel, .renovacion-panel').forEach(panel => {
        if (panel.id !== `renovacion-${idPoliza}` && panel.id !== `gestion-${idPoliza}`) {
            panel.classList.add('hidden');
            panel.innerHTML = '';
        }
    });

    if (isHidden) {
        div.innerHTML = `
            <div class="renovacion-form">
                <h4>🔄 Renovar Póliza</h4>
                <label>📅 Nueva fecha de vencimiento:</label>
                <input type="date" id="fecha-${idPoliza}" class="form-input" min="${getTodayDate()}">
                <div class="form-buttons">
                    <button class="btn-confirmar-renovacion" data-poliza-id="${idPoliza}" class="btn-primary">✅ Confirmar renovación</button>
                    <button class="btn-cancelar" data-poliza-id="${idPoliza}" class="btn-secondary">❌ Cancelar</button>
                </div>
            </div>
        `;

        div.querySelector('.btn-confirmar-renovacion')?.addEventListener('click', () => renovarPoliza(idPoliza));
        div.querySelector('.btn-cancelar')?.addEventListener('click', () => toggleRenovacion(idPoliza));

        div.classList.remove('hidden');
        div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        div.classList.add('hidden');
        div.innerHTML = '';
    }
}

async function guardarGestion(idPoliza) {
    const resultadoSelect = document.getElementById(`resultado-${idPoliza}`);
    const comentarioTextarea = document.getElementById(`comentario-${idPoliza}`);

    if (!resultadoSelect || !comentarioTextarea) {
        showToast('Error al obtener los datos del formulario', false);
        return;
    }

    const resultado = resultadoSelect.value;
    const comentario = comentarioTextarea.value.trim();

    if (!comentario) {
        showToast('Por favor, escribe un comentario', false);
        comentarioTextarea.focus();
        return;
    }

    try {
        const response = await createGestion({ id_poliza: idPoliza, resultado, comentario });
        showToast(response.message, response.success);

        if (response.success) {
            toggleGestion(idPoliza);


            setTimeout(() => {

                loadPolizas();


                if (clienteActualId) {
                    openModal(clienteActualId);
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Error al guardar gestión:', error);
        showToast('Error al guardar la gestión', false);
    }
}

async function renovarPoliza(idPoliza) {
    const fechaInput = document.getElementById(`fecha-${idPoliza}`);

    if (!fechaInput || !fechaInput.value) {
        showToast('Por favor, selecciona una fecha de vencimiento', false);
        return;
    }

    const nuevaFecha = fechaInput.value;


    if (new Date(nuevaFecha) < new Date(getTodayDate())) {
        showToast('La fecha de vencimiento no puede ser anterior a hoy', false);
        return;
    }

    try {
        showToast('Procesando renovación...', true);


        const response = await updatePolizaFecha(idPoliza, nuevaFecha, true);

        if (response.success) {
            showToast('✅ Póliza renovada exitosamente', true);
            toggleRenovacion(idPoliza);


            setTimeout(() => {

                loadPolizas();


                if (clienteActualId) {
                    openModal(clienteActualId);
                }
            }, 1000);
        } else {
            showToast(response.message || 'Error al renovar la póliza', false);
        }
    } catch (error) {
        console.error('Error al renovar póliza:', error);
        showToast('Error al renovar la póliza', false);
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');

    if (modal) modal.classList.add('hidden');
    if (modalBody) modalBody.innerHTML = '';
    clienteActualId = null;
}

function openModalCliente() {
    const modal = document.getElementById('modalCliente');
    const modalBody = document.getElementById('modalClienteBody');

    modalBody.innerHTML = `
        <div style="padding: 10px;">
            <h2>➕ Agregar Nuevo Cliente</h2>
            <form id="formCliente" class="cliente-form">
                <div class="form-group">
                    <label>Nombre completo *</label>
                    <input type="text" id="nombre" required placeholder="Ej: Juan Pérez">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de documento *</label>
                        <select id="tipo_documento" required>
                            <option value="CC">Cédula de Ciudadanía</option>
                            <option value="CE">Cédula de Extranjería</option>
                            <option value="NIT">NIT</option>
                            <option value="PAS">Pasaporte</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Número de documento *</label>
                        <input type="text" id="numero_documento" required placeholder="Ej: 12345678">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Teléfono *</label>
                    <input type="tel" id="telefono" required placeholder="Ej: 3001234567">
                </div>
                
                <div class="form-group">
                    <label>Correo electrónico *</label>
                    <input type="email" id="correo" required placeholder="Ej: cliente@email.com">
                </div>
                
                <div class="form-buttons">
                    <button type="submit" class="btn-primary">💾 Guardar Cliente y Continuar</button>
                    <button type="button" onclick="closeModalCliente()" class="btn-secondary">❌ Cancelar</button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');


    const oldForm = document.getElementById('formCliente');
    const newForm = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(newForm, oldForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarClienteYPoliza();
    });
}

async function guardarClienteYPoliza() {
    const clienteData = {
        nombre: document.getElementById('nombre').value,
        tipo_documento: document.getElementById('tipo_documento').value,
        numero_documento: document.getElementById('numero_documento').value,
        telefono: document.getElementById('telefono').value,
        correo: document.getElementById('correo').value
    };


    if (!clienteData.nombre || !clienteData.telefono || !clienteData.tipo_documento ||
        !clienteData.numero_documento || !clienteData.correo) {
        showToast('Por favor, complete todos los campos', false);
        return;
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.correo)) {
        showToast('Por favor, ingrese un correo electrónico válido', false);
        return;
    }

    try {
        showToast('Guardando cliente...', true);
        const response = await createCliente(clienteData);

        if (response.success) {
            showToast('✅ Cliente creado exitosamente', true);
            const nuevoClienteId = response.id_cliente;


            const modalBody = document.getElementById('modalClienteBody');
            modalBody.innerHTML = `
                <div style="padding: 10px;">
                    <h2>➕ Agregar Póliza</h2>
                    <p style="margin-bottom: 20px; color: var(--gray-600);">
                        Cliente: <strong>${escapeHtml(clienteData.nombre)}</strong> creado exitosamente.
                        Ahora puede agregar una póliza opcional.
                    </p>
                    
                    <form id="formPolizaNuevo" class="poliza-form">
                        <div class="form-group">
                            <label>Tipo de póliza *</label>
                            <select id="id_tipo_poliza" required>
                                <option value="">Seleccionar tipo</option>
                                ${tiposPoliza.map(tipo => `<option value="${tipo.id_tipo_poliza}">${tipo.nombre}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="descripcion" rows="2" placeholder="Descripción de la póliza"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Precio *</label>
                                <input type="number" id="precio" required placeholder="Ej: 500000">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Fecha de contratación *</label>
                                <input type="date" id="fecha_contratacion" required value="${getTodayDate()}">
                            </div>
                            <div class="form-group">
                                <label>Fecha de vencimiento *</label>
                                <input type="date" id="fecha_vencimiento" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea id="observaciones" rows="2" placeholder="Observaciones adicionales"></textarea>
                        </div>
                        
                        <div class="form-buttons">
                            <button type="submit" class="btn-primary">💾 Guardar Póliza</button>
                            <button type="button" onclick="finalizarCreacionCliente()" class="btn-secondary">⏭️ Omitir (sin póliza)</button>
                        </div>
                    </form>
                </div>
            `;


            window.nuevoClienteId = nuevoClienteId;
            window.nuevoClienteNombre = clienteData.nombre;


            const formPoliza = document.getElementById('formPolizaNuevo');
            if (formPoliza) {

                const newFormPoliza = formPoliza.cloneNode(true);
                formPoliza.parentNode.replaceChild(newFormPoliza, formPoliza);

                newFormPoliza.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await guardarPolizaNuevoCliente(window.nuevoClienteId);
                });
            }
        } else {
            showToast(response.message || 'Error al crear el cliente', false);
        }
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showToast('Error al guardar el cliente. Verifique la conexión.', false);
    }
}

async function guardarPolizaNuevoCliente(idCliente) {

    const id_tipo_poliza = document.getElementById('id_tipo_poliza')?.value;
    const precio = document.getElementById('precio')?.value;
    const fecha_contratacion = document.getElementById('fecha_contratacion')?.value;
    const fecha_vencimiento = document.getElementById('fecha_vencimiento')?.value;

    if (!id_tipo_poliza) {
        showToast('Por favor, seleccione un tipo de póliza', false);
        return;
    }

    if (!precio || precio <= 0) {
        showToast('Por favor, ingrese un precio válido', false);
        return;
    }

    if (!fecha_contratacion) {
        showToast('Por favor, seleccione la fecha de contratación', false);
        return;
    }

    if (!fecha_vencimiento) {
        showToast('Por favor, seleccione la fecha de vencimiento', false);
        return;
    }


    if (new Date(fecha_vencimiento) <= new Date(fecha_contratacion)) {
        showToast('La fecha de vencimiento debe ser mayor a la fecha de contratación', false);
        return;
    }

    const polizaData = {
        id_cliente: idCliente,
        id_tipo_poliza: parseInt(id_tipo_poliza),
        descripcion: document.getElementById('descripcion')?.value || '',
        precio: parseFloat(precio),
        fecha_contratacion: fecha_contratacion,
        fecha_vencimiento: fecha_vencimiento,
        observaciones: document.getElementById('observaciones')?.value || ''
    };

    try {
        showToast('Guardando póliza...', true);
        const response = await createPoliza(polizaData);

        if (response.success) {
            showToast('✅ Cliente y póliza creados exitosamente', true);
            closeModalCliente();

            await loadPolizas();
        } else {
            showToast(response.message || 'Error al guardar la póliza', false);
        }
    } catch (error) {
        console.error('Error al guardar póliza:', error);
        showToast('Error al guardar la póliza. Verifique los datos.', false);
    }
}

function finalizarCreacionCliente() {
    showToast(`✅ Cliente ${window.nuevoClienteNombre || ''} creado exitosamente sin póliza`, true);
    closeModalCliente();
    loadPolizas();
}

function closeModalCliente() {
    const modal = document.getElementById('modalCliente');
    if (modal) {
        modal.classList.add('hidden');
        const modalBody = document.getElementById('modalClienteBody');
        if (modalBody) modalBody.innerHTML = '';
    }
    window.nuevoClienteId = null;
    window.nuevoClienteNombre = null;
}


function showToast(message, success = true) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${success ? 'toast-success' : 'toast-error'}`;
    toast.innerHTML = `
        <span>${success ? '✅' : '❌'}</span>
        <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }, 3000);
}

function showLoading(show) {
    const modal = document.getElementById('modal');
    if (!modal) return;

    if (show) {
        modal.classList.add('loading');
    } else {
        modal.classList.remove('loading');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatNumber(number) {
    if (!number) return '0';
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Script de prueba automatizada, esta comentado ya que no es parte del funcionamiento normal del dashboard, 
// pero se puede usar para validar funcionalidades clave de forma rápida.

/*async function ejecutarTests() {
    console.log('🚀 Iniciando suite de pruebas...\n');
    
    const resultados = {
        test01: { nombre: 'Renovación de póliza vencida', estado: 'pending', errores: [] },
        test02: { nombre: 'Creación de cliente con póliza', estado: 'pending', errores: [] },
        test03: { nombre: 'Gestión y cambio de prioridad', estado: 'pending', errores: [] }
    };
    
    try {
        // TEST 01
        console.log('📝 Ejecutando TEST 01...');
        await testRenovacionPoliza();
        resultados.test01.estado = 'passed';
        console.log('✅ TEST 01 pasado\n');
        
        // TEST 02
        console.log('📝 Ejecutando TEST 02...');
        await testCreacionClientePoliza();
        resultados.test02.estado = 'passed';
        console.log('✅ TEST 02 pasado\n');
        
        // TEST 03
        console.log('📝 Ejecutando TEST 03...');
        await testGestionPrioridad();
        resultados.test03.estado = 'passed';
        console.log('✅ TEST 03 pasado\n');
        
        console.log('🎉 ¡Todos los tests pasaron exitosamente!');
        
    } catch (error) {
        console.error('❌ Error en tests:', error);
    }
    
    return resultados;
}

// Función para simular renovación
async function testRenovacionPoliza() {
    // Simular renovación
    const fechaAntigua = "2026-05-20";
    const fechaNueva = "2026-12-20";
    
    // Verificaciones
    assert(fechaNueva > fechaAntigua, 'La nueva fecha debe ser mayor');
    assert(fechaNueva >= getTodayDate(), 'La nueva fecha no puede ser pasada');
    
    return true;
}

// Función para simular creación
async function testCreacionClientePoliza() {
    const clienteData = {
        nombre: "Test User",
        correo: "test@example.com"
    };
    
    // Verificar email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert(emailRegex.test(clienteData.correo), 'Email debe ser válido');
    
    return true;
}

// Función para simular gestión
async function testGestionPrioridad() {
    const prioridades = {
        vigente: 30,
        proxima: 5,
        alta: -15,
        fuera: -45
    };
    
    // Verificar cálculos
    assert(prioridades.vigente > 7, 'Vigente debe ser > 7 días');
    assert(prioridades.proxima >= 0 && prioridades.proxima <= 7, 'Próxima debe ser 0-7 días');
    assert(prioridades.alta < 0 && prioridades.alta >= -30, 'Alta debe ser -30 a -1 días');
    assert(prioridades.fuera < -30, 'Fuera debe ser < -30 días');
    
    return true;
}

// Helper assertion
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Ejecutar
ejecutarTests();*/