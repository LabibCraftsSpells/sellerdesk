'use strict';

const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/stock');

const adjustStockSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  variant_id: Joi.number().integer().positive().allow(null),
  quantity: Joi.number().integer().min(1).required(),
  type: Joi.string().valid('restock', 'deducted', 'returned', 'damaged', 'correction', 'add', 'remove', 'adjustment', 'damage', 'initial').required(),
  reason: Joi.string().trim().allow(null, ''),
});

router.use(auth);

router.post('/adjust', validate(adjustStockSchema), ctrl.adjustStock);

module.exports = router;
