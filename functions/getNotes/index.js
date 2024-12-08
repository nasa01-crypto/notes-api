const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // Tabellnamn från miljövariabel

module.exports.getNotes = async (event) => {
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    // Hämta alla anteckningar från DynamoDB
    const result = await dynamoDb.scan(params).promise();

    // Om inga anteckningar hittades, returnera ett tomt svar
    if (result.Items.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No notes found' }),
      };
    }

    // Returnera alla anteckningar som JSON
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error getting notes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not fetch notes' }),
    };
  }
};
