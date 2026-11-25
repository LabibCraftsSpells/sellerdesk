'use strict';

const router = require('express').Router();
const { auth, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/reports');

router.use(auth);

// Operational dashboard analytics (accessible to both Admin and Staff)
router.get('/dashboard', ctrl.getDashboard);

// Admin-only reports & profit analysis
router.get('/profit', requireAdmin, ctrl.getProfitReport);
router.get('/orders/export', ctrl.exportOrders);

module.exports = router;
