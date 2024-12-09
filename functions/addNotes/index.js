import middy from '@middy/core';
import { validateToken } from '../middleware/auth';
import { noteSchema } from '../../schemas/postNotes/schema'; // Schema för POST
import validator from '@middy/validator';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;

const addNoteHandler = async (event) => {
  const { title, text } = JSON.parse(event.body);

  const note = {
    id: uuidv4(),  // Generera unikt ID med UUID
    title,
    text,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };

  const params = {
    TableName: TABLE_NAME,
    Item: note,
  };

  try {
    await dynamoDb.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Note created successfully',
        data: note,
      }),
    };
  } catch (error) {
    console.error('Error adding note:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: 'Something went wrong. Please try again later.',
      }),
    };
  }
};

export const addNote = middy(addNoteHandler)
  .use(validateToken)  // Kontrollera att användaren är inloggad
  .use(validator({ inputSchema: noteSchema }));  // Validera input mot schema
