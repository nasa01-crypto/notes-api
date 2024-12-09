import AWS from 'aws-sdk';
import middy from '@middy/core';
import { validateToken } from '../middleware/auth';  // Middleware för att validera token
import httpJsonBodyParser from '@middy/http-json-body-parser';  // För att enkelt hantera request body

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // Tabellnamn för anteckningar

const updateNoteHandler = async (event) => {
  const { id, title, text } = JSON.parse(event.body);  // Hämta anteckningens data från request body
  const user = event.user;  // Användaren som är inloggad (från JWT-token)

  // Kontrollera om id, title eller text saknas
  if (!id || !title || !text) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID, title, and text are required' }),
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
        body: JSON.stringify({ message: 'You can only update your own notes' }),
      };
    }

    // Uppdatera anteckningens titel och text
    const updatedNote = {
      ...note,
      title,
      text,
      modifiedAt: new Date().toISOString(),  // Sätt ny modifierad tid
    };

    const updateParams = {
      TableName: TABLE_NAME,
      Item: updatedNote,
    };

    // Uppdatera anteckningen i DynamoDB
    await dynamoDb.put(updateParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(updatedNote),  // Returnera den uppdaterade anteckningen
    };
  } catch (error) {
    console.error('Error updating note:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not update note' }),
    };
  }
};

// Wrappa Lambda-funktionen med Middy för att använda validateToken och body parser middleware
export const updateNote = middy(updateNoteHandler)
  .use(validateToken)  // Verifiera token för att säkerställa att användaren är inloggad
  .use(httpJsonBodyParser());  // För att enkelt hantera JSON-body i förfrågan
