// functions/notes/addNote/index.js
const AWS = require('aws-sdk');
const middy = require('middy');
const createError = require('http-errors');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { validateNote } = require('../../../middleware/noteValidatorMiddleware');
const { authenticateUser } = require('../../../middleware/authMiddleware'); // Importera auth-middleware
const httpErrorHandler = require('@middy/http-error-handler');
const httpJsonBodyParser = require('@middy/http-json-body-parser');

const TABLE_NAME = 'Notes';

const createNote = async (title, text, userId) => {
  const noteId = `note-${Date.now()}`; // Generera ett unikt ID för anteckningen
  const timestamp = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: noteId,
      title: title,
      text: text,
      userId: userId,
      createdAt: timestamp,
      modifiedAt: timestamp,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    return params.Item;
  } catch (error) {
    throw createError(500, 'Unable to create note in DynamoDB: ' + error.message);
  }
};

// Lambda-handler för addNote
const handler = async (event) => {
  const userId = event.user.userId;  // Hämta userId från JWT-token
  const { title, text } = JSON.parse(event.body);

  try {
    const newNote = await createNote(title, text, userId);
    return {
      statusCode: 200,
      body: JSON.stringify(newNote),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error: ' + error.message }),
    };
  }
};

// Wrap Lambda handler med Middy, använda validering och autentisering
module.exports.handler = middy(handler)
  .use(authenticateUser)  // Använd auth middleware för att verifiera användare
  .use(validateNote)      // Använd noteValidator för att validera request body
  .use(httpJsonBodyParser())  // Parsea JSON-objekt från request
  .use(httpErrorHandler());   // Hantera HTTP fel
