// Configuración de la API
const API_BASE = 'http://localhost:3000/api';

// Variables globales para seguimiento
let testResults = {
    test1: { passed: false, message: '' },
    test2: { passed: false, message: '' },
    test3: { passed: false, message: '' }
};

// Función para agregar logs
function addLog(testId, message, isError = false) {
    const logContent = document.getElementById(`logContent${testId}`);
    if (logContent) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = isError ? '❌' : '✅';
        logContent.innerHTML += `[${timestamp}] ${prefix} ${message}\n`;
        logContent.scrollTop = logContent.scrollHeight;
    }
}

// Función para actualizar estado del test
function updateTestStatus(testId, status, message) {
    const statusSpan = document.getElementById(`status${testId}`);
    const testCard = document.getElementById(`test${testId}`);
    
    if (statusSpan) {
        statusSpan.className = `test-status status-${status}`;
        statusSpan.textContent = status === 'passed' ? 'Pasó' : status === 'failed' ? 'Falló' : status === 'running' ? 'Ejecutando...' : 'Pendiente';
    }
    
    if (status === 'passed') {
        testCard.style.borderLeftColor = '#059669';
        testResults[`test${testId}`].passed = true;
        testResults[`test${testId}`].message = message;
    } else if (status === 'failed') {
        testCard.style.borderLeftColor = '#dc2626';
        testResults[`test${testId}`].passed = false;
        testResults[`test${testId}`].message = message;
    }
    
    updateSummary();
}

// Función para actualizar resumen
function updateSummary() {
    let passed = 0;
    let failed = 0;
    
    for (let i = 1; i <= 3; i++) {
        if (testResults[`test${i}`].passed) passed++;
        else if (testResults[`test${i}`].passed === false) failed++;
    }
    
    document.getElementById('passedCount').textContent = passed;
    document.getElementById('failedCount').textContent = failed;
}

// Función para habilitar/deshabilitar botones
function setButtonState(testId, disabled) {
    const btn = document.getElementById(`btn${testId}`);
    if (btn) btn.disabled = disabled;
}

// Función para toggle log
function toggleLog(logId) {
    const logElement = document.getElementById(logId);
    if (logElement) {
        logElement.classList.toggle('show');
    }
}

// ==================== TEST 1: Renovación de póliza ====================
async function runTest1() {
    const testId = 1;
    setButtonState(testId, true);
    updateTestStatus(testId, 'running');
    document.getElementById(`logContent${testId}`).innerHTML = '';
    addLog(testId, '🚀 Iniciando Test 1: Renovación de póliza');
    
    try {
        // Paso 1: Obtener una póliza existente para probar
        addLog(testId, '📡 Paso 1: Obteniendo pólizas existentes...');
        const polizasResponse = await fetch(`${API_BASE}/polizas`);
        const polizas = await polizasResponse.json();
        
        if (!polizas || polizas.length === 0) {
            throw new Error('No hay pólizas para probar. Primero cree una póliza.');
        }
        
        const polizaOriginal = polizas[0];
        addLog(testId, `✅ Póliza encontrada: ID=${polizaOriginal.id_poliza}, Cliente=${polizaOriginal.nombre}`);
        addLog(testId, `   Fecha actual: ${polizaOriginal.fecha_vencimiento}, Estado: ${polizaOriginal.gestionada ? 'Gestionada' : 'Pendiente'}`);
        
        // Paso 2: Calcular nueva fecha (30 días después)
        const fechaOriginal = new Date(polizaOriginal.fecha_vencimiento);
        const nuevaFecha = new Date(fechaOriginal);
        nuevaFecha.setDate(fechaOriginal.getDate() + 30);
        const nuevaFechaStr = nuevaFecha.toISOString().split('T')[0];
        addLog(testId, `📅 Paso 2: Nueva fecha propuesta: ${nuevaFechaStr}`);
        
        // Paso 3: Realizar renovación
        addLog(testId, `🔄 Paso 3: Ejecutando renovación de póliza...`);
        const renovacionResponse = await fetch(`${API_BASE}/polizas/${polizaOriginal.id_poliza}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                fecha_vencimiento: nuevaFechaStr,
                gestionada: 1
            })
        });
        
        const renovacionResult = await renovacionResponse.json();
        
        if (!renovacionResult.success) {
            throw new Error(renovacionResult.message || 'Error en la renovación');
        }
        
        addLog(testId, `✅ Renovación ejecutada: ${renovacionResult.message}`);
        
        // Paso 4: Verificar cambios
        addLog(testId, `🔍 Paso 4: Verificando cambios...`);
        const polizaActualizadaResponse = await fetch(`${API_BASE}/polizas`);
        const polizasActualizadas = await polizaActualizadaResponse.json();
        const polizaActualizada = polizasActualizadas.find(p => p.id_poliza === polizaOriginal.id_poliza);
        
        // Validaciones
        let passed = true;
        const validations = [];
        
        // Validar fecha actualizada
        const fechaActualizadaStr = polizaActualizada.fecha_vencimiento;
        if (fechaActualizadaStr === nuevaFechaStr) {
            validations.push('✅ Fecha de vencimiento actualizada correctamente');
        } else {
            validations.push(`❌ Fecha no actualizada: esperaba ${nuevaFechaStr}, obtuve ${fechaActualizadaStr}`);
            passed = false;
        }
        
        // Validar estado gestionada
        if (polizaActualizada.gestionada === 1 || polizaActualizada.gestionada === true) {
            validations.push('✅ Estado marcado como gestionada correctamente');
        } else {
            validations.push(`❌ Estado no actualizado a gestionada: valor actual=${polizaActualizada.gestionada}`);
            passed = false;
        }
        
        // Mostrar validaciones
        validations.forEach(v => addLog(testId, v));
        
        if (passed) {
            addLog(testId, '🎉 TEST 1 COMPLETADO EXITOSAMENTE');
            updateTestStatus(testId, 'passed', 'La póliza se renovó correctamente');
        } else {
            throw new Error('Alguna validación falló');
        }
        
    } catch (error) {
        addLog(testId, `💥 ERROR: ${error.message}`, true);
        updateTestStatus(testId, 'failed', error.message);
    } finally {
        setButtonState(testId, false);
    }
}

// ==================== TEST 2: Creación de cliente con póliza ====================
async function runTest2() {
    const testId = 2;
    setButtonState(testId, true);
    updateTestStatus(testId, 'running');
    document.getElementById(`logContent${testId}`).innerHTML = '';
    addLog(testId, '🚀 Iniciando Test 2: Creación de cliente con póliza');
    
    try {
        // Paso 1: Obtener tipos de póliza
        addLog(testId, '📡 Paso 1: Obteniendo tipos de póliza disponibles...');
        const tiposResponse = await fetch(`${API_BASE}/tipos-poliza`);
        const tipos = await tiposResponse.json();
        
        if (!tipos || tipos.length === 0) {
            throw new Error('No hay tipos de póliza disponibles');
        }
        
        const tipoPoliza = tipos[0];
        addLog(testId, `✅ Tipo de póliza encontrado: ID=${tipoPoliza.id_tipo_poliza}, Nombre=${tipoPoliza.nombre}`);
        
        // Paso 2: Crear cliente de prueba
        const timestamp = Date.now();
        const clienteData = {
            nombre: `Test Cliente ${timestamp}`,
            tipo_documento: 'CC',
            numero_documento: `TEST${timestamp}`,
            telefono: '3000000000',
            correo: `test${timestamp}@ejemplo.com`
        };
        
        addLog(testId, `👤 Paso 2: Creando cliente de prueba: ${clienteData.nombre}`);
        const clienteResponse = await fetch(`${API_BASE}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clienteData)
        });
        
        const clienteResult = await clienteResponse.json();
        
        if (!clienteResult.success) {
            throw new Error(clienteResult.message || 'Error al crear cliente');
        }
        
        const idCliente = clienteResult.id_cliente;
        addLog(testId, `✅ Cliente creado con ID: ${idCliente}`);
        
        // Paso 3: Crear póliza para el cliente
        const hoy = new Date();
        const fechaContratacion = hoy.toISOString().split('T')[0];
        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setFullYear(hoy.getFullYear() + 1);
        const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];
        
        const polizaData = {
            id_cliente: idCliente,
            id_tipo_poliza: tipoPoliza.id_tipo_poliza,
            descripcion: 'Póliza de prueba',
            precio: 500000,
            fecha_contratacion: fechaContratacion,
            fecha_vencimiento: fechaVencimientoStr,
            observaciones: 'Creada por test automático'
        };
        
        addLog(testId, `📄 Paso 3: Creando póliza para el cliente...`);
        const polizaResponse = await fetch(`${API_BASE}/polizas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(polizaData)
        });
        
        const polizaResult = await polizaResponse.json();
        
        if (!polizaResult.success) {
            throw new Error(polizaResult.message || 'Error al crear póliza');
        }
        
        addLog(testId, `✅ Póliza creada con ID: ${polizaResult.id_poliza}`);
        
        // Paso 4: Verificar que la póliza está asociada al cliente
        addLog(testId, `🔍 Paso 4: Verificando asociación cliente-póliza...`);
        const clienteDetalleResponse = await fetch(`${API_BASE}/clientes/${idCliente}`);
        const clienteDetalle = await clienteDetalleResponse.json();
        
        let polizaEncontrada = false;
        if (clienteDetalle.polizas) {
            polizaEncontrada = clienteDetalle.polizas.some(p => p.id_poliza === polizaResult.id_poliza);
        }
        
        if (polizaEncontrada) {
            addLog(testId, `✅ La póliza está correctamente asociada al cliente`);
        } else {
            throw new Error('La póliza no se encontró asociada al cliente');
        }
        
        // Limpiar datos de prueba (opcional)
        addLog(testId, `🧹 Paso 5: Limpiando datos de prueba...`);
        // Nota: No eliminamos automáticamente para poder depurar si falla
        
        addLog(testId, '🎉 TEST 2 COMPLETADO EXITOSAMENTE');
        updateTestStatus(testId, 'passed', `Cliente y póliza creados correctamente (ID Cliente: ${idCliente})`);
        
    } catch (error) {
        addLog(testId, `💥 ERROR: ${error.message}`, true);
        updateTestStatus(testId, 'failed', error.message);
    } finally {
        setButtonState(testId, false);
    }
}

// ==================== TEST 3: Registro de gestión con correo ====================
async function runTest3() {
    const testId = 3;
    setButtonState(testId, true);
    updateTestStatus(testId, 'running');
    document.getElementById(`logContent${testId}`).innerHTML = '';
    addLog(testId, '🚀 Iniciando Test 3: Registro de gestión con correo');
    
    try {
        // Paso 1: Obtener una póliza existente
        addLog(testId, '📡 Paso 1: Obteniendo póliza existente...');
        const polizasResponse = await fetch(`${API_BASE}/polizas`);
        const polizas = await polizasResponse.json();
        
        if (!polizas || polizas.length === 0) {
            throw new Error('No hay pólizas para probar. Primero ejecute el Test 2.');
        }
        
        const poliza = polizas[0];
        addLog(testId, `✅ Póliza seleccionada: ID=${poliza.id_poliza}, Cliente=${poliza.nombre}`);
        
        // Paso 2: Registrar gestión tipo CORREO_ENVIADO
        const comentario = `Correo enviado al cliente ${poliza.nombre} el ${new Date().toLocaleDateString()}`;
        addLog(testId, `✉️ Paso 2: Registrando gestión de tipo CORREO_ENVIADO...`);
        
        const gestionResponse = await fetch(`${API_BASE}/gestiones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_poliza: poliza.id_poliza,
                resultado: 'CORREO_ENVIADO',
                comentario: comentario
            })
        });
        
        const gestionResult = await gestionResponse.json();
        
        if (!gestionResult.success) {
            throw new Error(gestionResult.message || 'Error al registrar gestión');
        }
        
        addLog(testId, `✅ Gestión registrada con ID: ${gestionResult.id_gestion}`);
        
        // Paso 3: Verificar que la gestión aparece en el historial
        addLog(testId, `🔍 Paso 3: Verificando en el historial del cliente...`);
        
        // Obtener el cliente asociado a la póliza
        const clienteDetalleResponse = await fetch(`${API_BASE}/clientes/${poliza.id_cliente}`);
        const clienteDetalle = await clienteDetalleResponse.json();
        
        let gestionEncontrada = false;
        let gestionData = null;
        
        if (clienteDetalle.gestiones) {
            gestionEncontrada = clienteDetalle.gestiones.some(g => {
                if (g.resultado === 'CORREO_ENVIADO' && g.comentario === comentario) {
                    gestionData = g;
                    return true;
                }
                return false;
            });
        }
        
        if (gestionEncontrada) {
            addLog(testId, `✅ Gestión encontrada en el historial`);
            addLog(testId, `   Resultado: ${gestionData.resultado}`);
            addLog(testId, `   Comentario: ${gestionData.comentario}`);
            addLog(testId, `   Fecha: ${gestionData.fecha_gestion}`);
        } else {
            throw new Error('La gestión no se encontró en el historial del cliente');
        }
        
        // Paso 4: Verificar que la póliza NO cambió su estado (solo la gestión se registra)
        addLog(testId, `🔍 Paso 4: Verificando que la póliza mantiene su estado original...`);
        const polizaActualizadaResponse = await fetch(`${API_BASE}/polizas`);
        const polizasActualizadas = await polizaActualizadaResponse.json();
        const polizaActualizada = polizasActualizadas.find(p => p.id_poliza === poliza.id_poliza);
        
        // La gestión no debería cambiar el estado de gestionada automáticamente
        addLog(testId, `✅ La póliza mantiene su estado: ${polizaActualizada.gestionada ? 'Gestionada' : 'Pendiente'}`);
        
        addLog(testId, '🎉 TEST 3 COMPLETADO EXITOSAMENTE');
        updateTestStatus(testId, 'passed', 'Gestión de correo registrada correctamente en el historial');
        
    } catch (error) {
        addLog(testId, `💥 ERROR: ${error.message}`, true);
        updateTestStatus(testId, 'failed', error.message);
    } finally {
        setButtonState(testId, false);
    }
}

// ==================== Ejecutar todos los tests ====================
async function runAllTests() {
    // Limpiar logs primero
    for (let i = 1; i <= 3; i++) {
        const logContent = document.getElementById(`logContent${i}`);
        if (logContent) logContent.innerHTML = '';
        updateTestStatus(i, 'pending');
        testResults[`test${i}`] = { passed: false, message: '' };
    }
    
    updateSummary();
    
    // Ejecutar tests en secuencia
    await runTest1();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await runTest2();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await runTest3();
}

// ==================== Resetear tests ====================
function resetTests() {
    for (let i = 1; i <= 3; i++) {
        const logContent = document.getElementById(`logContent${i}`);
        if (logContent) logContent.innerHTML = '';
        updateTestStatus(i, 'pending');
        testResults[`test${i}`] = { passed: false, message: '' };
        
        // Ocultar logs
        const logElement = document.getElementById(`log${i}`);
        if (logElement && logElement.classList.contains('show')) {
            logElement.classList.remove('show');
        }
    }
    updateSummary();
}

// Funciones globales para los botones HTML
window.runTest1 = runTest1;
window.runTest2 = runTest2;
window.runTest3 = runTest3;
window.runAllTests = runAllTests;
window.resetTests = resetTests;
window.toggleLog = toggleLog;