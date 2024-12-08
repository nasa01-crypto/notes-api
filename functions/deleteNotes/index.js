const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();  // Se till att instansen är definierad korrekt
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // Tabellnamn från miljövariabel

module.exports.deleteNotes = async (event) => {
  const noteId = event.pathParameters.id;  // Hämta ID från URL-parameter

  if (!noteId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID is required' }),
    };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: noteId,  // Hitta anteckningen baserat på ID
    },
  };

  try {
    // Försök att ta bort anteckningen från DynamoDB
    const result = await dynamoDb.delete(params).promise();

    // Om ingen post hittades med det angivna ID:t
    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Note with ID ${noteId} not found` }),
      };
    }

    // Om borttagningen lyckades, returnera 200
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Note with ID ${noteId} deleted successfully` }),
    };
  } catch (error) {
    console.error('Error deleting note:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not delete note', error: error.message }),
    };
  }
};
