// functions/notes/getAllNotes/index.js
const AWS = require('aws-sdk');
const middy = require('middy');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { authenticateUser } = require('../../../middleware/authMiddleware');
const httpErrorHandler = require('@middy/http-error-handler');
const httpJsonBodyParser = require('@middy/http-json-body-parser');

const TABLE_NAME = 'Notes';

// Funktion för att hämta alla anteckningar för en användare
const getAllNotes = async (userId) => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  };

  const result = await dynamoDb.query(params).promise();
  return result.Items;
};

// Lambda-handler för getAllNotes
const handler = async (event) => {
  const userId = event.user.userId;  // Hämtar användarens ID från JWT-token

  try {
    const notes = await getAllNotes(userId);
    return {
      statusCode: 200,
      body: JSON.stringify(notes),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

// Wrap Lambda handler med Middy, använd autentisering och HTTP Error Handler
module.exports.handler = middy(handler)
  .use(authenticateUser)  // Middleware för att autentisera användare
  .use(httpJsonBodyParser())  // Middleware för att hantera JSON-kroppar
  .use(httpErrorHandler());   // Hantera eventuella HTTP-fel
