const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// För att interagera med DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Hämta användare från DynamoDB
async function getUser(username) {
    try {
        const user = await dynamoDb.get({
            TableName: process.env.ACCOUNTS_TABLE, // Tabellnamn från miljövariabel
            Key: { username } // Hämta användaren baserat på användarnamn
        }).promise();

        if (user?.Item) {
            return user.Item; // Om användaren finns, returnera den
        } else {
            return false; // Om användaren inte finns, returnera false
        }
    } catch (error) {
        console.error('Error fetching user from DynamoDB:', error);
        return false;
    }
}

// Hantera inloggning
async function login(username, password) {
    const user = await getUser(username); // Hämta användaren från DynamoDB

    if (!user) {
        return { success: false, message: 'Incorrect username or password' }; // Om användaren inte finns
    }

    // Jämför lösenordet med det hashade värdet i databasen
    const correctPassword = await bcrypt.compare(password, user.password);

    if (!correctPassword) {
        return { success: false, message: 'Incorrect username or password' }; // Om lösenordet inte stämmer
    }

    // Hämta hemlig nyckel från miljövariabler (JWS_SECRET istället för KEY)
    const jwsSecret = process.env.JWS_SECRET; 
    if (!jwsSecret) {
        console.error('JWS_SECRET is not defined!');
        return { success: false, message: 'Internal server error' };
    }

    // Om lösenordet är korrekt, skapa JWT-token
    const token = jwt.sign(
        { userId: user.userID, username: user.username }, // Payload (användarinformation)
        jwsSecret, // Den hemliga nyckeln (från miljövariabel)
        { expiresIn: '1h' } // Token kommer att löpa ut efter 1 timme
    );

    return { success: true, token }; // Returnera resultatet med token
}

// Exportera login-funktionen så att den kan användas i Lambda
module.exports.login = async (event) => {
    try {
        // Hämta data från HTTP-begäran
        const { username, password } = JSON.parse(event.body);

        // Anropa login-funktionen
        const result = await login(username, password);

        // Skicka tillbaka svaret baserat på inloggningsresultatet
        if (result.success) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Login successful',
                    token: result.token
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
    } catch (error) {
        console.error('Error handling the request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error'
            })
        };
    }
};
