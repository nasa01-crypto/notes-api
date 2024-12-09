const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { validateLogin } = require('../../../middleware/noteValidatorMiddleware');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const middy = require('middy');
const httpErrorHandler = require('@middy/http-error-handler');
const httpJsonBodyParser = require('@middy/http-json-body-parser');

const TABLE_NAME = 'Users'; // DynamoDB-tabell för användare

// Hjälpfunktion för att skapa en JWT-token
const createToken = (email) => {
  const payload = { email };
  const secret = process.env.JWT_SECRET; // Din hemliga nyckel för JWT
  const options = { expiresIn: '1h' }; // Token går ut efter 1 timme

  return jwt.sign(payload, secret, options);
};

// Hjälpfunktion för att hitta användare i DynamoDB
const findUserByEmail = async (email) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { email }, // Hitta användare via e-post
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item; // Om användaren finns, returnera objektet
  } catch (error) {
    throw createError(500, 'Unable to retrieve user: ' + error.message);
  }
};

// Lambda handler för login
const handler = async (event) => {
  // Validera användardata (email och password)
  await validateLogin(event);

  const { email, password } = JSON.parse(event.body);

  try {
    // Hitta användaren i databasen
    const user = await findUserByEmail(email);

    // Om användaren inte finns, kasta ett 401 Unauthorized-fel
    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    // Kontrollera om lösenordet är korrekt (jämför hashrade lösenord)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Om lösenordet inte stämmer, kasta ett 401 Unauthorized-fel
    if (!isPasswordValid) {
      throw createError(401, 'Invalid credentials');
    }

    // Skapa en JWT-token för den inloggade användaren
    const token = createToken(email);

    // Returnera en lyckad inloggning med token
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
        token: token,
      }),
    };
  } catch (error) {
    console.error(error);
    throw createError(500, 'Unable to login');
  }
};

// Använd middleware för att bearbeta JSON och hantera fel
module.exports.handler = middy(handler)
  .use(httpJsonBodyParser()) // Bearbeta JSON i body
  .use(httpErrorHandler()); // Hantera HTTP-fel
