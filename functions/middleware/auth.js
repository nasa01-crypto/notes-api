import jwt from 'jsonwebtoken';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key'; // Din hemliga nyckel
const JWT_EXPIRATION_TIME = '1h'; // Tokenens livslängd (1 timme)

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
  };

  const options = { expiresIn: JWT_EXPIRATION_TIME };

  return jwt.sign(payload, JWT_SECRET_KEY, options);
};

// Middleware för att validera JWT-token
export const validateToken = async (handler) => {
  const token = handler.event.headers.Authorization;

  if (!token) {
    console.error('Token not provided');
    throw new Error('Unauthorized'); // Om ingen token finns
  }

  try {
    const tokenWithoutBearer = token.replace(/^Bearer /, '');
    const decoded = jwt.verify(tokenWithoutBearer, JWT_SECRET_KEY);
    handler.event.user = decoded; // Sätt användarinformation i eventet
    return handler.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized'); // Om token är ogiltig eller har gått ut
  }
};
