import middy from '@middy/core';
import { validateToken } from '../middleware/auth';
import { getNotesSchema } from '../../schemas/getNotes/schema'; // Schema för GET
import validator from '@middy/validator';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;

const getAllNotesHandler = async (event) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const result = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notes retrieved successfully',
        data: result.Items,
      }),
    };
  } catch (error) {
    console.error('Error retrieving notes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
      }),
    };
  }
};

export const getAllNotes = middy(getAllNotesHandler)
  .use(validateToken)
  .use(validator({ inputSchema: getNotesSchema }));
