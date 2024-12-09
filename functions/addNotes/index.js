import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import middy from '@middy/core';
import validator from '@middy/validator'; 
import httpJsonBodyParser from '@middy/http-json-body-parser'; 
import httpErrorHandler from '@middy/http-error-handler'; 
import { validateToken } from '../middleware/auth';  // Importera auth.js
import { eventSchema } from '../../schemas/postNotes/schema'; 

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;

// Funktion för att skapa anteckningen
const addNotesHandler = async (event) => {
  const { title, text } = event.body;  // Hämta title och text från body

  // Generera ett nytt unikt ID med uuid
  const note = {
    id: uuidv4(),
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

// Wrappa Lambda-funktionen med Middy och använd de olika middlewares
export const addNotes = middy(addNotesHandler)
  .use(httpJsonBodyParser())  // Används för att automatisk parsa JSON i request body
  .use(validator({ inputSchema: eventSchema }))  // Använd validator för att validera indata baserat på eventSchema
  .use(validateToken)  // Middleware för autentisering (säkerställer att användaren är inloggad)
  .use(httpErrorHandler());  // Middleware för att hantera och returnera HTTP-fel på ett enhetligt sätt
