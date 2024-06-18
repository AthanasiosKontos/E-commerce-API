const db = require('../db');

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Orders');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await db.query('SELECT * FROM Orders WHERE id = $1', [orderId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
