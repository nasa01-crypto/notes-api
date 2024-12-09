import AWS from 'aws-sdk';
import middy from '@middy/core';
import { validateToken } from '../middleware/auth';  // Middleware för att validera token
import httpErrorHandler from '@middy/http-error-handler';  // För att hantera fel på ett bra sätt

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // DynamoDB-tabellnamn

const deleteNoteHandler = async (event) => {
  const { id } = event.pathParameters;  // Hämta note-id från path parameters
  const user = event.user;  // Användaren som är inloggad (från JWT-token)

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Note ID is required' }),
    };
  }

  // Försök hämta anteckningen från DynamoDB
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    const note = result.Item;

    // Kontrollera om anteckningen finns
    if (!note) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Note not found' }),
      };
    }

    // Kontrollera att den inloggade användaren äger anteckningen
    if (note.user !== user.username) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'You can only delete your own notes' }),
      };
    }

    // Ta bort anteckningen från DynamoDB
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    await dynamoDb.delete(deleteParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Note deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting note:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not delete note' }),
    };
  }
};

// Wrappa Lambda-funktionen med Middy för att använda validateToken och felhantering
export const deleteNote = middy(deleteNoteHandler)
  .use(validateToken)  // Verifiera token för att säkerställa att användaren är inloggad
  .use(httpErrorHandler());  // För att hantera fel och ge bra svar
