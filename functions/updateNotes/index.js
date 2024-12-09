// functions/notes/updateNote/index.js
const AWS = require('aws-sdk');
const middy = require('middy');
const createError = require('http-errors');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { validateNote } = require('../../../middleware/noteValidatorMiddleware');
const { authenticateUser } = require('../../../middleware/authMiddleware');
const httpErrorHandler = require('@middy/http-error-handler');
const httpJsonBodyParser = require('@middy/http-json-body-parser');

const TABLE_NAME = 'Notes';

const updateNote = async (id, title, text, userId) => {
  const timestamp = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    Key: { id, userId },
    UpdateExpression: 'SET title = :title, text = :text, modifiedAt = :modifiedAt',
    ExpressionAttributeValues: {
      ':title': title,
      ':text': text,
      ':modifiedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    const result = await dynamoDb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    throw createError(500, 'Unable to update note in DynamoDB: ' + error.message);
  }
};

// Lambda-handler för updateNote
const handler = async (event) => {
  const userId = event.user.userId;
  const { id, title, text } = JSON.parse(event.body);

  try {
    const updatedNote = await updateNote(id, title, text, userId);
    if (!updatedNote) {
      throw createError(404, 'Note not found');  // 404 om anteckningen inte hittades
    }
    return {
      statusCode: 200,
      body: JSON.stringify(updatedNote),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

// Wrap Lambda handler med Middy
module.exports.handler = middy(handler)
  .use(authenticateUser)
  .use(validateNote)
  .use(httpJsonBodyParser())
  .use(httpErrorHandler());
