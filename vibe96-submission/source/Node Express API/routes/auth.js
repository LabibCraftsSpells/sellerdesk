'use strict';

const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middleware/validate');
const { auth, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/auth');

const phoneRegex = /^01[3-9]\d{8}$/;

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(1).required().messages({
    'any.required': 'Password is required',
  }),
});

const changePasswordSchema = Joi.object({
  old_password: Joi.string(),
  current_password: Joi.string(),
  new_password: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters',
  }),
}).or('old_password', 'current_password');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'staff', 'manager').default('staff'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  role: Joi.string().valid('admin', 'staff', 'manager'),
  is_active: Joi.boolean(),
}).min(1);

// Public routes
router.post('/login', validate(loginSchema), ctrl.login);

// Protected routes
router.post('/logout', auth, ctrl.logout);
router.get('/me', auth, ctrl.me);
router.put('/change-password', auth, validate(changePasswordSchema), ctrl.changePassword);

// Admin-only user management
router.post('/users', auth, requireAdmin, validate(createUserSchema), ctrl.createUser);
router.get('/users', auth, requireAdmin, ctrl.listUsers);
router.put('/users/:id', auth, requireAdmin, validate(updateUserSchema), ctrl.updateUser);
router.delete('/users/:id', auth, requireAdmin, ctrl.deleteUser);

module.exports = router;
