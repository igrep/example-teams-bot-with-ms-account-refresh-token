require('dotenv').config();
const { AuthorizationCode } = require('simple-oauth2');

// <ConfigureOAuth2Snippet>
// Configure simple-oauth2
module.exports.Oauth2Client = new AuthorizationCode({
    client: {
        id: process.env.OAUTH_APP_ID,
        secret: process.env.OAUTH_APP_PASSWORD
    },
    auth: {
        tokenHost: process.env.OAUTH_AUTHORITY,
        authorizePath: process.env.OAUTH_AUTHORIZE_ENDPOINT,
        tokenPath: process.env.OAUTH_TOKEN_ENDPOINT
    }
});
// </ConfigureOAuth2Snippet>
