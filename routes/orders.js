const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get all orders
router.get('/', orderController.getOrders);

// Get order by ID
router.get('/:orderId', orderController.getOrderById);

module.exports = router;
