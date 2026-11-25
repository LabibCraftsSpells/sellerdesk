'use strict';

const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/cod');

const settleCodSchema = Joi.object({
  order_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  courier: Joi.string().trim().allow(null, ''),
  received_amount: Joi.number().min(0),
  settled_at: Joi.string().isoDate().allow(null, ''),
  notes: Joi.string().trim().allow(null, ''),
});

router.use(auth);

router.get('/summary', ctrl.getCodSummary);
router.get('/pending', ctrl.getPendingCod);
router.post('/settle', validate(settleCodSchema), ctrl.settleCod);

module.exports = router;
