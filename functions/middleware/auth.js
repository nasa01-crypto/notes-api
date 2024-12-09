import jwt from 'jsonwebtoken';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';  // Din hemliga nyckel, bör vara säker och lagras som en miljövariabel
const JWT_EXPIRATION_TIME = '1h';  // Tokenens livslängd (1 timme)

// Funktion för att skapa JWT-token vid inloggning
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
  };

  // Sätt expirationstid till 1 timme
  const options = { expiresIn: JWT_EXPIRATION_TIME };

  // Signera och skapa token
  return jwt.sign(payload, JWT_SECRET_KEY, options);
};

// Middleware för att validera JWT-token
export const validateToken = async (handler) => {
  const token = handler.event.headers.Authorization;

  if (!token) {
    console.error('Token not provided');
    throw new Error('Unauthorized');  // Om ingen token finns med i headern
  }

  try {
    // Ta bort "Bearer " om den finns i token
    const tokenWithoutBearer = token.replace(/^Bearer /, '');

    // Verifiera token
    const decoded = jwt.verify(tokenWithoutBearer, JWT_SECRET_KEY);

    // Om token är giltig, sätt användarinformation i eventet för vidare användning
    handler.event.user = decoded;

    return handler.next();  // Fortsätt med nästa middleware/funktion
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized');  // Om token är ogiltig eller har gått ut
  }
};
