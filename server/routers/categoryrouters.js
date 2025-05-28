const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);
router.post('/', CategoryController.create);
router.get('/', CategoryController.findAll);
router.put('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

module.exports = router;
