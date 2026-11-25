'use strict';

const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middleware/validate');
const { auth, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/orders');

const phoneRegex = /^01[3-9]\d{8}$/;

const orderItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  variant_id: Joi.number().integer().positive().allow(null),
  product_name: Joi.string().trim().required(),
  variant_name: Joi.string().trim().allow(null, ''),
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().min(0).required(),
  cost_price: Joi.number().min(0).default(0),
});

const customerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(phoneRegex)
    .required()
    .messages({ 'string.pattern.base': 'Phone must be a valid Bangladeshi number (01XXXXXXXXX)' }),
  district: Joi.string().trim().allow(null, ''),
  area: Joi.string().trim().allow(null, ''),
  full_address: Joi.string().trim().allow(null, ''),
  address: Joi.string().trim().allow(null, ''),
  notes: Joi.string().trim().allow(null, ''),
});

const createOrderSchema = Joi.object({
  customer: customerSchema.required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  payment_method: Joi.string()
    .valid('cod', 'bkash', 'nagad', 'bank', 'advance', 'prepaid', 'mixed')
    .required(),
  source: Joi.string().trim().allow(null, ''),
  courier: Joi.string().trim().allow(null, ''),
  tracking_id: Joi.string().trim().allow(null, ''),
  delivery_charge: Joi.number().min(0).default(0),
  shipping_cost: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  advance_amount: Joi.number().min(0).default(0),
  advance_payment: Joi.number().min(0).default(0),
  note: Joi.string().trim().allow(null, ''),
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid('new', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'),
  courier: Joi.string().trim().allow(null, ''),
  tracking_id: Joi.string().trim().allow(null, ''),
  note: Joi.string().trim().allow(null, ''),
  delivery_charge: Joi.number().min(0),
  shipping_cost: Joi.number().min(0),
  discount: Joi.number().min(0),
  advance_amount: Joi.number().min(0),
  advance_payment: Joi.number().min(0),
}).min(1);

const bulkStatusSchema = Joi.object({
  order_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  status: Joi.string()
    .valid('new', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled')
    .required(),
  note: Joi.string().trim().allow(null, ''),
});

router.use(auth);

router.post('/', validate(createOrderSchema), ctrl.createOrder);
router.get('/', ctrl.listOrders);
router.get('/:id', ctrl.getOrder);
router.put('/bulk-status', validate(bulkStatusSchema), ctrl.bulkUpdateStatus);
router.put('/:id', validate(updateOrderSchema), ctrl.updateOrder);
router.delete('/:id', requireAdmin, ctrl.deleteOrder);

module.exports = router;
