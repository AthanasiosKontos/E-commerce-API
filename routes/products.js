const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

// Get all products, optionally filtered by category
router.get('/', async (req, res) => {
  const { category } = req.query;

  try {
    const query = category
      ? 'SELECT * FROM Products WHERE category_id = $1'
      : 'SELECT * FROM Products';
    const params = category ? [category] : [];
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a single product by ID
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await db.query('SELECT * FROM Products WHERE id = $1', [productId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new product
router.post(
  '/',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('price').isDecimal().withMessage('Price must be a number'),
    body('stock').isInt().withMessage('Stock must be an integer'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, category_id } = req.body;

    try {
      const result = await db.query(
        'INSERT INTO Products (name, description, price, stock, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, price, stock, category_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Update an existing product
router.put(
  '/:productId',
  [
    body('name').optional().not().isEmpty().withMessage('Name is required'),
    body('price').optional().isDecimal().withMessage('Price must be a number'),
    body('stock').optional().isInt().withMessage('Stock must be an integer'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.params;
    const { name, description, price, stock, category_id } = req.body;

    try {
      const result = await db.query(
        'UPDATE Products SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), stock = COALESCE($4, stock), category_id = COALESCE($5, category_id), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [name, description, price, stock, category_id, productId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ msg: 'Product not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Delete a product
router.delete('/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await db.query('DELETE FROM Products WHERE id = $1 RETURNING *', [productId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
