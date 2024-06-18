const pool = require('../db');

const checkoutCart = async (req, res) => {
    const { cartId } = req.params;
    const { userId, paymentMethod } = req.body;

    try {
        // Validate the cart
        const cart = await pool.query('SELECT * FROM carts WHERE id = $1', [cartId]);
        if (cart.rows.length === 0) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Fetch cart items and calculate total amount
        const cartItems = await pool.query('SELECT * FROM cartitems WHERE cart_id = $1', [cartId]);
        const totalAmount = cartItems.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Create an order
        const order = await pool.query(
            'INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING *',
            [userId, 'completed', totalAmount]
        );

        // Create order items
        const orderId = order.rows[0].id;
        const orderItemsQueries = cartItems.rows.map(item => {
            return pool.query(
                'INSERT INTO orderitems (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        });
        await Promise.all(orderItemsQueries);

        // Record payment
        const payment = await pool.query(
            'INSERT INTO payments (order_id, payment_method, amount, payment_status) VALUES ($1, $2, $3, $4) RETURNING *',
            [orderId, paymentMethod, totalAmount, 'success']
        );

        // Clear the cart
        await pool.query('DELETE FROM cartitems WHERE cart_id = $1', [cartId]);
        await pool.query('DELETE FROM carts WHERE id = $1', [cartId]);

        // Respond with the created order
        res.status(201).json({ msg: 'Checkout successful', order: order.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { checkoutCart };
