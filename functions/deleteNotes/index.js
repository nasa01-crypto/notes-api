// functions/notes/deleteNote/index.js
const AWS = require('aws-sdk');
const middy = require('middy');
const createError = require('http-errors');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { authenticateUser } = require('../../../middleware/authMiddleware');
const httpErrorHandler = require('@middy/http-error-handler');
const httpJsonBodyParser = require('@middy/http-json-body-parser');

const TABLE_NAME = 'Notes';

// Funktion för att ta bort en anteckning
const deleteNote = async (id, userId) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id, userId },  // För att säkerställa att användaren kan ta bort sin egen anteckning
  };

  try {
    // Försök att ta bort anteckningen från DynamoDB
    const result = await dynamoDb.delete(params).promise();

    if (!result) {
      throw createError(404, 'Note not found');  // Returnera 404 om anteckningen inte hittades
    }

    return { message: 'Note deleted successfully' };  // Framgångsrikt meddelande
  } catch (error) {
    // Om något går fel vid borttagning
    throw createError(500, 'Unable to delete note in DynamoDB: ' + error.message);
  }
};

// Lambda-handler för deleteNote
const handler = async (event) => {
  const userId = event.user.userId;  // Hämtar användarens ID från JWT-token
  const { id } = event.pathParameters;  // Förväntar sig att ID:et skickas i URL:en som en pathparameter

  try {
    const response = await deleteNote(id, userId);  // Anropar deleteNote med ID och userId
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

// Wrap Lambda handler med Middy, använda autentisering och HTTP Error Handler
module.exports.handler = middy(handler)
  .use(authenticateUser)  // Middleware för att autentisera användare
  .use(httpJsonBodyParser())  // Middleware för att hantera JSON-kroppar (om relevant)
  .use(httpErrorHandler());   // Hantera eventuella HTTP-fel
