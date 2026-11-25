'use strict';

const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middleware/validate');
const { auth, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/products');

const variantSchema = Joi.object({
  name: Joi.string().trim().required(),
  sku: Joi.string().trim().allow(null, ''),
  sale_price: Joi.number().min(0),
  cost_price: Joi.number().min(0),
  stock_quantity: Joi.number().integer().min(0).default(0),
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  sku: Joi.string().trim().allow(null, ''),
  category: Joi.string().trim().allow(null, ''),
  sale_price: Joi.number().min(0).required(),
  cost_price: Joi.number().min(0).default(0),
  stock_quantity: Joi.number().integer().min(0).default(0),
  low_stock_threshold: Joi.number().integer().min(0).default(5),
  unit: Joi.string().trim().default('pcs'),
  image_url: Joi.string().uri().allow(null, ''),
  description: Joi.string().trim().allow(null, ''),
  variants: Joi.array().items(variantSchema).default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  sku: Joi.string().trim().allow(null, ''),
  category: Joi.string().trim().allow(null, ''),
  sale_price: Joi.number().min(0),
  cost_price: Joi.number().min(0),
  stock_quantity: Joi.number().integer().min(0),
  low_stock_threshold: Joi.number().integer().min(0),
  unit: Joi.string().trim(),
  image_url: Joi.string().uri().allow(null, ''),
  description: Joi.string().trim().allow(null, ''),
  is_active: Joi.boolean(),
}).min(1);

router.use(auth);

router.get('/', ctrl.listProducts);
router.post('/', requireAdmin, validate(createProductSchema), ctrl.createProduct);
router.get('/:id', ctrl.getProduct);
router.put('/:id', requireAdmin, validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', requireAdmin, ctrl.deleteProduct);

module.exports = router;
