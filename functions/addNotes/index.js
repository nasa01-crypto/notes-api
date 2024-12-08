import { v4 as uuidv4 } from 'uuid'; // Importera uuid
import AWS from 'aws-sdk';
import middy from '@middy/core';
import authMiddleware from '../authorizer/index.js';  // Importera authMiddleware

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;

const addNotesHandler = async (event) => {
  const { title, text } = JSON.parse(event.body);  // Hämta title och text från body

  // Kontrollera om title eller text saknas
  if (!title || !text) {
    return {
      statusCode: 400,  // Om data saknas (Bad Request)
      body: JSON.stringify({ message: 'Title and text are required' }),
    };
  }

  const note = {
    id: uuidv4(), // Generera ett nytt unikt ID med uuid
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
    // Lägg till anteckningen i DynamoDB
    await dynamoDb.put(params).promise();  
    
    return {
      statusCode: 200,  // Om anteckningen skapades korrekt (OK)
      body: JSON.stringify(note),  // Returnera den skapade anteckningen
    };
  } catch (error) {
    console.error('Error adding note:', error);

    // Om något oväntat går fel, returnera 500 (Internal Server Error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not add note' }),
    };
  }
};

// Wrappa Lambda-funktionen med Middy och använd authMiddleware
export const addNotes = middy(addNotesHandler).use(authMiddleware);
