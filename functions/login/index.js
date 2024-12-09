import { generateToken } from '../middleware/auth';  // Importera funktion för att skapa JWT-token
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';  // För att jämföra lösenord

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // DynamoDB-tabellnamn

const loginHandler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);

    // Hämta användaren från databasen
    const params = {
      TableName: TABLE_NAME,
      Key: { username },
    };

    const result = await dynamoDb.get(params).promise();
    const user = result.Item;

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid username or password' }),
      };
    }

    // Jämför lösenordet med det hashade lösenordet
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid username or password' }),
      };
    }

    // Skapa JWT-token om autentiseringen lyckas
    const token = generateToken({ username });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
        token,  // Returnera token
      }),
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not login' }),
    };
  }
};

export const login = loginHandler;
