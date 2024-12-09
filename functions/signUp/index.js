import { generateToken } from '../middleware/auth';  // Importera funktion för att skapa JWT-token
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';  // För att hasha lösenord

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.RESOURCES_TABLENAME;  // DynamoDB-tabellnamn

const signUpHandler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);

    // Kontrollera om användarnamnet redan finns
    const params = {
      TableName: TABLE_NAME,
      Key: { username },
    };

    const existingUser = await dynamoDb.get(params).promise();
    if (existingUser.Item) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Username already exists' }),
      };
    }

    // Hasha lösenordet
    const hashedPassword = await bcrypt.hash(password, 10);

    // Spara användaren i DynamoDB
    const user = {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    const putParams = {
      TableName: TABLE_NAME,
      Item: user,
    };

    await dynamoDb.put(putParams).promise();

    // Skapa JWT-token
    const token = generateToken({ username });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully',
        token,  // Returnera token
      }),
    };
  } catch (error) {
    console.error('Error during signup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not create user' }),
    };
  }
};

export const signUp = signUpHandler;
