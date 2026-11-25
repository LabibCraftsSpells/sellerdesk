'use strict';

const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/customers');

const phoneRegex = /^01[3-9]\d{8}$/;

const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string()
    .pattern(phoneRegex)
    .messages({ 'string.pattern.base': 'Phone must be a valid Bangladeshi number (01XXXXXXXXX)' }),
  address: Joi.string().trim().allow(null, ''),
  notes: Joi.string().trim().allow(null, ''),
  is_risky: Joi.boolean(),
}).min(1);

router.use(auth);

// Order matters: /lookup must come before /:id
router.get('/lookup', ctrl.lookupCustomer);
router.get('/', ctrl.listCustomers);
router.get('/:id', ctrl.getCustomer);
router.put('/:id', validate(updateCustomerSchema), ctrl.updateCustomer);

module.exports = router;
