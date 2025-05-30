const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.trim().startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }
    const token = authHeader.trim().split(/\s+/)[1]; // Handle multiple spaces
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid user' });
    req.user = { id: user.id, tier: user.tier };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
