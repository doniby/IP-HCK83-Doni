const UserController = require('../controllers/UserController');

const router = require('express').Router();

router.post('/register', UserController.Register);
router.post('/login', UserController.Login);
router.post('/google-login', UserController.GoogleLogin);

module.exports = router;