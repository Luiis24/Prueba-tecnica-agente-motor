const express = require('express');

const router = express.Router();

const dataController = require('../controllers/dataController');

router.get('/tipos-poliza', dataController.getTiposPoliza);

router.get('/polizas', dataController.getPolizas);

router.get('/clientes/:id', dataController.getClienteById);

router.post('/clientes', dataController.createCliente);

router.post('/polizas', dataController.createPoliza);

router.post('/gestiones', dataController.createGestion);

router.put('/polizas/:id', dataController.updatePoliza);


module.exports = router;