/**
 * Location routes — /api/locations. Reads for any staff; writes for manager/owner.
 */
const express = require('express');
const controller = require('../controllers/location.controller');
const validate = require('../middleware/validate.middleware');
const schema = require('../validation/location.validation');
const { idParam } = require('../validation/common');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStaffUp, requireManagerUp } = require('../middleware/rbac.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', requireStaffUp, controller.list);
router.get('/:id', requireStaffUp, validate({ params: idParam }), controller.getById);
router.post('/', requireManagerUp, validate(schema.create), controller.create);
router.patch('/:id', requireManagerUp, validate({ params: idParam, ...schema.update }), controller.update);
router.delete('/:id', requireManagerUp, validate({ params: idParam }), controller.remove);

module.exports = router;
