const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { validateSignUp } = require('../../../middleware/noteValidatorMiddleware');
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

// Hjälpfunktion för att skapa en ny användare
const createUser = async (email, password) => {
  // Hasha lösenordet
  const hashedPassword = await bcrypt.hash(password, 10);

  const params = {
    TableName: TABLE_NAME,
    Item: {
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    await dynamoDb.put(params).promise();
  } catch (error) {
    throw createError(500, 'Unable to create user: ' + error.message);
  }
};

// Lambda handler för signUp
const handler = async (event) => {
  // Validera användardata
  await validateSignUp(event);

  const { email, password } = JSON.parse(event.body);

  try {
    // Skapa användaren
    await createUser(email, password);

    // Skapa en JWT-token för den nya användaren
    const token = createToken(email);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully',
        token: token,
      }),
    };
  } catch (error) {
    console.error(error);
    throw createError(500, 'Unable to sign up user');
  }
};

// Använd middleware för att bearbeta JSON och hantera fel
module.exports.handler = middy(handler)
  .use(httpJsonBodyParser()) // Bearbeta JSON i body
  .use(httpErrorHandler()); // Hantera HTTP-fel
