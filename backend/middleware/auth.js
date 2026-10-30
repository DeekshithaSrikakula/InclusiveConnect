const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'inclusiveconnect_sap_hackfest_2026_secret_key';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrator privileges required' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireAdmin
};
