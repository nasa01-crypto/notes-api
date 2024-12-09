import middy from '@middy/core';
import { validateToken } from '../middleware/auth';
import { updateNoteSchema } from '../../schemas/putNotes/schema'; // Schema för PUT
import validator from '@middy/validator';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;

const updateNoteHandler = async (event) => {
  const { id } = event.pathParameters;
  const { title, text } = JSON.parse(event.body);

  const params = {
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set title = :title, text = :text, modifiedAt = :modifiedAt',
    ExpressionAttributeValues: {
      ':title': title,
      ':text': text,
      ':modifiedAt': new Date().toISOString(),
    },
    ReturnValues: 'UPDATED_NEW',
  };

  try {
    const result = await dynamoDb.update(params).promise();
    
    if (!result.Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Note not found',
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Note updated successfully',
        data: result.Attributes,
      }),
    };
  } catch (error) {
    console.error('Error updating note:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
      }),
    };
  }
};

export const updateNote = middy(updateNoteHandler)
  .use(validateToken)
  .use(validator({ inputSchema: updateNoteSchema }));
