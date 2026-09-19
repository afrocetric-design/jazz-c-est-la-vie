const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expiree' });
  }
}

// SUPER_ADMIN et ORG_ADMIN voient toute l'organisation, SITE_MANAGER/EMPLOYEE sont limites a leur site.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acces refuse pour ce role' });
    }
    next();
  };
}

// Verifie que le siteId demande appartient a l'organisation de l'utilisateur,
// et que les roles restreints (SITE_MANAGER / EMPLOYEE) n'accedent qu'a leur propre site.
function canAccessSite(req, siteId) {
  if (!siteId) return false;
  if (['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) return true;
  return req.user.siteId === siteId;
}

module.exports = { authenticate, authorize, canAccessSite };
