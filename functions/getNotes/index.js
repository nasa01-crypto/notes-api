import AWS from 'aws-sdk';
import middy from '@middy/core';
import { validateToken } from '../middleware/auth';  // Middleware för att validera token
import httpJsonBodyParser from '@middy/http-json-body-parser';  // För att enkelt hantera request body

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // DynamoDB-tabellnamn

const getAllNotesHandler = async (event) => {
  const user = event.user;  // Inloggad användare (från JWT-token)

  // Hämta alla anteckningar från DynamoDB
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const result = await dynamoDb.scan(params).promise();  // Hämta alla anteckningar
    const notes = result.Items;

    if (!notes || notes.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No notes found' }),
      };
    }

    // Filtrera anteckningar om du vill att användaren endast ska kunna se sina egna anteckningar
    const userNotes = notes.filter(note => note.user === user.username);

    return {
      statusCode: 200,
      body: JSON.stringify(userNotes),  // Returnera anteckningar för den inloggade användaren
    };
  } catch (error) {
    console.error('Error fetching notes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not fetch notes' }),
    };
  }
};

// Wrappa Lambda-funktionen med Middy och använd validateToken som middleware
export const getAllNotes = middy(getAllNotesHandler)
  .use(validateToken)  // Verifiera token för att säkerställa att användaren är inloggad
  .use(httpJsonBodyParser());  // För att enkelt hantera JSON-body (om behövs)
