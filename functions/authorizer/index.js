import jwt from 'jsonwebtoken';

const authMiddleware = {
  before: async (handler) => {
    const token = handler.event.headers.Authorization;

    // Om ingen token är med, kasta ett Unauthorized-fel (401)
    if (!token) {
      handler.response = {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: No token provided' }),
      };
      throw new Error('Unauthorized');
    }

    try {
      // Försök att verifiera JWT-token
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWS_SECRET);
      handler.event.user = decoded;  // Spara användardata för senare användning
    } catch (error) {
      // Om token är ogiltig eller utgången, kasta ett Unauthorized-fel (401)
      handler.response = {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: Invalid or expired token' }),
      };
      throw new Error('Unauthorized');
    }

    return handler;
  },
};

export default authMiddleware;
