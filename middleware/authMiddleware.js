const jwt = require('jsonwebtoken');

const authMiddleware = {
    // Middleware to check if user is authenticated
    isAuthenticated: (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CITMCA17771024046');
            req.user = decoded;
            
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(401).json({ error: 'Invalid token' });
        }
    },
    
    // Middleware to check if user is admin
    isAdmin: (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CITMCA17771024046');
            
            if (decoded.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            req.user = decoded;
            
            next();
        } catch (error) {
            console.error('Admin authentication error:', error);
            res.status(401).json({ error: 'Invalid token' });
        }
    }
};

module.exports = authMiddleware;
