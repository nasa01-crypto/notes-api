// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const JWT_SECRET = 'your_jwt_secret_key'; // Byt ut med din hemliga nyckel

// Middleware för att autentisera användaren baserat på JWT-token
const authenticateUser = (handler) => {
  return async (event, context) => {
    const token = event.headers.Authorization?.replace('Bearer ', '');

    if (!token) {
      throw createError(401, 'Authorization token missing');
    }

    try {
      // Verifiera token
      const decoded = jwt.verify(token, JWT_SECRET);
      event.user = decoded;  // Lägg till decoded payload i event
      return handler(event, context);  // Fortsätt med den ursprungliga handlern
    } catch (error) {
      throw createError(401, 'Invalid or expired token');
    }
  };
};

module.exports = { authenticateUser };
