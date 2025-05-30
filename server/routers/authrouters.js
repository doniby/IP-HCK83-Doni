const UserController = require('../controllers/UserController');
const authenticate = require('../middlewares/authenticate');

const router = require('express').Router();

router.post('/register', UserController.Register);
router.post('/login', UserController.Login);
router.post('/google-login', UserController.GoogleLogin);

// Protected routes
router.use(authenticate);
router.put('/profile', UserController.updateProfile);

module.exports = router;