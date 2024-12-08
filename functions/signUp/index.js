const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');

// För att interagera med DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Dynamisk import av nanoid
async function generateUserId() {
    const { nanoid } = await import('nanoid'); // Dynamisk import för nanoid
    return nanoid(); // Generera användar-ID
}

// Skapa användarkonto i DynamoDB
async function createAccount(username, hashedPassword, userID, firstname, lastname) {
    try {
        await dynamoDb.put({
            TableName: process.env.ACCOUNTS_TABLE, // Miljövariabel för tabellnamnet
            Item: {
                username: username,
                password: hashedPassword,
                firstname: firstname,
                lastname: lastname,
                userID: userID,
            }
        }).promise();

        return { success: true, userID: userID };
    } catch (error) {
        console.log('Error while creating account:', error);
        return { success: false, message: 'Could not create account' };
    }
}

// Hantera användarregistrering
async function signup(username, password, firstname, lastname) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userID = await generateUserId(); // Generera användar-ID med nanoid

        const result = await createAccount(username, hashedPassword, userID, firstname, lastname);
        return result;
    } catch (error) {
        console.error('Error during signup:', error);
        return { success: false, message: 'Error during signup' };
    }
}

// Lambda handler
module.exports.signUp = async (event) => {
    const { username, password, firstname, lastname } = JSON.parse(event.body);

    // Anropa signup-funktionen och hantera resultatet
    const result = await signup(username, password, firstname, lastname);

    // Bygg svaret baserat på om kontot skapades eller inte
    if (result.success) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Account created successfully',
                userID: result.userID
            })
        };
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: result.message || 'An error occurred'
            })
        };
    }
};
