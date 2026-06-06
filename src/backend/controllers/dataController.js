const db = require('../config/db');

const getPolizas = (req, res) => {
    try {
        const polizas = db.prepare(`
            SELECT p.id_poliza, c.id_cliente, c.nombre, c.telefono, tp.nombre AS tipo_poliza, 
                   p.descripcion, p.precio, p.fecha_vencimiento, p.gestionada 
            FROM polizas p 
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
            INNER JOIN tipo_poliza tp ON p.id_tipo_poliza = tp.id_tipo_poliza 
            ORDER BY p.fecha_vencimiento ASC
        `).all();
        res.status(200).json(polizas);
        log(polizas);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener las pólizas'
        });
    }
};

const getTiposPoliza = (req, res) => {
    try {
        const tipos = db.prepare(`SELECT * FROM tipo_poliza ORDER BY nombre`).all();
        res.status(200).json(tipos);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener tipos de póliza'
        });
    }
};

const getClienteById = (req, res) => {
    try {
        const { id } = req.params;
        const cliente = db.prepare(`SELECT * FROM clientes WHERE id_cliente = ?`).get(id);
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        const polizas = db.prepare(`
            SELECT p.*, tp.nombre AS tipo_poliza 
            FROM polizas p 
            INNER JOIN tipo_poliza tp ON p.id_tipo_poliza = tp.id_tipo_poliza 
            WHERE p.id_cliente = ?
            ORDER BY p.fecha_vencimiento ASC
        `).all(id);
        
        const gestiones = db.prepare(`
            SELECT g.* FROM gestiones g 
            INNER JOIN polizas p ON p.id_poliza = g.id_poliza 
            WHERE p.id_cliente = ? 
            ORDER BY g.fecha_gestion DESC
        `).all(id);
        
        res.status(200).json({
            cliente,
            polizas,
            gestiones
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener cliente'
        });
    }
};

const createCliente = (req, res) => {
    try {
        const { nombre, telefono, tipo_documento, numero_documento, correo } = req.body;
        
        // Validaciones
        if (!nombre || !telefono || !tipo_documento || !numero_documento || !correo) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }
        
        // Verificar si ya existe un cliente con ese documento
        const existeCliente = db.prepare(`SELECT * FROM clientes WHERE numero_documento = ?`).get(numero_documento);
        if (existeCliente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un cliente con ese documento'
            });
        }
        
        // Crear cliente
        const result = db.prepare(`
            INSERT INTO clientes (nombre, telefono, tipo_documento, numero_documento, correo) 
            VALUES (?, ?, ?, ?, ?)
        `).run(nombre, telefono, tipo_documento, numero_documento, correo);
        
        res.status(201).json({
            success: true,
            message: 'Cliente creado correctamente',
            id_cliente: result.lastInsertRowid
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Error al crear cliente'
        });
    }
};

const createPoliza = (req, res) => {
    try {
        const { id_cliente, id_tipo_poliza, descripcion, precio, fecha_contratacion, fecha_vencimiento, observaciones } = req.body;
        
        // Validaciones
        if (!id_cliente || !id_tipo_poliza || !precio || !fecha_contratacion || !fecha_vencimiento) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }
        
        // Verificar que el cliente existe
        const cliente = db.prepare(`SELECT * FROM clientes WHERE id_cliente = ?`).get(id_cliente);
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // Verificar que el tipo de póliza existe
        const tipoPoliza = db.prepare(`SELECT * FROM tipo_poliza WHERE id_tipo_poliza = ?`).get(id_tipo_poliza);
        if (!tipoPoliza) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de póliza no válido'
            });
        }
        
        // Validar fechas
        if (new Date(fecha_vencimiento) <= new Date(fecha_contratacion)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de vencimiento debe ser mayor a la fecha de contratación'
            });
        }
        
        // Crear póliza
        const result = db.prepare(`
            INSERT INTO polizas (id_cliente, id_tipo_poliza, descripcion, precio, fecha_contratacion, fecha_vencimiento, observaciones, gestionada) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `).run(id_cliente, id_tipo_poliza, descripcion, precio, fecha_contratacion, fecha_vencimiento, observaciones);
        
        res.status(201).json({
            success: true,
            message: 'Póliza creada correctamente',
            id_poliza: result.lastInsertRowid
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Error al crear póliza'
        });
    }
};

const createGestion = (req, res) => {
    try {
        const { id_poliza, resultado, comentario } = req.body;
        
        // Validaciones
        if (!id_poliza || !resultado || !comentario) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }
        
        // Verificar que la póliza existe
        const poliza = db.prepare(`SELECT * FROM polizas WHERE id_poliza = ?`).get(id_poliza);
        if (!poliza) {
            return res.status(404).json({
                success: false,
                message: 'Póliza no encontrada'
            });
        }
        
        // Crear gestión
        const result = db.prepare(`
            INSERT INTO gestiones (id_poliza, fecha_gestion, resultado, comentario) 
            VALUES (?, datetime('now'), ?, ?)
        `).run(id_poliza, resultado, comentario);
        
        // Nota: Ya NO actualizamos automáticamente la póliza como gestionada aquí
        // Eso solo se hará a través del botón de renovar
        
        res.status(201).json({
            success: true,
            message: 'Gestión registrada correctamente',
            id_gestion: result.lastInsertRowid
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar gestión'
        });
    }
};

const updatePoliza = (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_vencimiento, gestionada, observaciones } = req.body;
        
        // Verificar que la póliza existe
        const poliza = db.prepare(`SELECT * FROM polizas WHERE id_poliza = ?`).get(id);
        if (!poliza) {
            return res.status(404).json({
                success: false,
                message: 'Póliza no encontrada'
            });
        }
        
        // Validar fecha si se está actualizando
        if (fecha_vencimiento && new Date(fecha_vencimiento) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La nueva fecha de vencimiento no puede estar en el pasado'
            });
        }
        
        // Construir la consulta dinámicamente según los campos proporcionados
        let updateFields = [];
        let updateValues = [];
        
        if (fecha_vencimiento !== undefined) {
            updateFields.push('fecha_vencimiento = ?');
            updateValues.push(fecha_vencimiento);
        }
        
        if (gestionada !== undefined) {
            updateFields.push('gestionada = ?');
            updateValues.push(gestionada);
        }
        
        if (observaciones !== undefined) {
            updateFields.push('observaciones = ?');
            updateValues.push(observaciones);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }
        
        updateValues.push(id);
        const query = `UPDATE polizas SET ${updateFields.join(', ')} WHERE id_poliza = ?`;
        
        db.prepare(query).run(...updateValues);
        
        // Si se renovó y se marcó como gestionada, crear una gestión automática
        if (gestionada === 1 && fecha_vencimiento) {
            db.prepare(`
                INSERT INTO gestiones (id_poliza, fecha_gestion, resultado, comentario) 
                VALUES (?, datetime('now'), 'RENOVACION_AUTOMATICA', ?)
            `).run(id, `Renovación automática. Nueva fecha de vencimiento: ${fecha_vencimiento}`);
        }
        
        res.status(200).json({
            success: true,
            message: 'Póliza actualizada correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar póliza'
        });
    }
};

module.exports = {
    getPolizas,
    getTiposPoliza,
    getClienteById,
    createCliente,
    createPoliza,
    createGestion,
    updatePoliza
};