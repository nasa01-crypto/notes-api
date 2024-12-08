const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.RESOURCES_TABLENAME;

module.exports.updateNotes = async (event) => {
  const noteId = event.pathParameters.id;
  const { title, text } = JSON.parse(event.body);

  // Kontrollera om titeln och texten finns och är inom gränserna
  if (!title || title.length > 50) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Title must be provided and less than 50 characters' }),
    };
  }

  if (!text || text.length > 300) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Text must be provided and less than 300 characters' }),
    };
  }

  const timestamp = new Date().toISOString();

  const updatedNote = {
    id: noteId,
    title,
    text,
    modifiedAt: timestamp,
  };

  // Första steget: Kontrollera om anteckningen finns innan vi försöker uppdatera den
  try {
    const getResult = await dynamoDB.get({
      TableName: TABLE_NAME,
      Key: { id: noteId },
    }).promise();

    // Om anteckningen inte finns
    if (!getResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Note not found' }),
      };
    }

    // Steg två: Uppdatera anteckningen i DynamoDB
    const updateResult = await dynamoDB.update({
      TableName: TABLE_NAME,
      Key: { id: noteId },
      UpdateExpression: 'set title = :title, #text = :text, modifiedAt = :modifiedAt',
      ExpressionAttributeNames: {
        '#text': 'text',  // Alias för "text" för att undvika konflikt med reserverade ord
      },
      ExpressionAttributeValues: {
        ':title': title,
        ':text': text,
        ':modifiedAt': timestamp,
      },
      ReturnValues: 'ALL_NEW', // Få tillbaka den uppdaterade anteckningen
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Note updated successfully', note: updateResult.Attributes }),
    };
  } catch (error) {
    console.error('Error updating note:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error. Failed to update note.' }),
    };
  }
};
