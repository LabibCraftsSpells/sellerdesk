'use strict';

const router = require('express').Router();
const { auth, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/settings');

router.use(auth);

// All authenticated users can read settings (for shop details, default delivery fees)
router.get('/', ctrl.getSettings);

// Only admins can modify shop settings
router.put('/', requireAdmin, ctrl.updateSettings);

module.exports = router;
