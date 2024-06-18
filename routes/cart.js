const express = require('express');
const db = require('../db');
const router = express.Router();

// Checkout a cart
router.post('/:cartId/checkout', async (req, res) => {
  const { cartId } = req.params;
  const { userId, paymentMethod } = req.body;

  try {
    // Validate the cart
    const cartResult = await db.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cart not found' });
    }

    const cartItemsResult = await db.query('SELECT * FROM cartitems WHERE cart_id = $1', [cartId]);
    if (cartItemsResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Cart is empty' });
    }

    // Create an order
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, 0, 'completed'] // Total amount will be updated later
    );

    // Insert order items and calculate the total amount
    let totalAmount = 0;
    for (const item of cartItemsResult.rows) {
      const productResult = await db.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      const productPrice = productResult.rows[0].price;
      const itemTotal = productPrice * item.quantity;
      totalAmount += itemTotal;

      await db.query(
        'INSERT INTO orderitems (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderResult.rows[0].id, item.product_id, item.quantity, productPrice]
      );
    }

    // Update the total amount in the order
    const orderId = orderResult.rows[0].id;
    await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);

    // Process the payment (Simulate payment success)
    const paymentStatus = 'success'; // Simulate payment success
    await db.query(
      'INSERT INTO payments (order_id, payment_method, amount, payment_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [orderId, paymentMethod, totalAmount, paymentStatus]
    );

    // Clear the cart
    await db.query('DELETE FROM cartitems WHERE cart_id = $1', [cartId]);

    res.status(200).json({ msg: 'Checkout successful', order: orderResult.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
