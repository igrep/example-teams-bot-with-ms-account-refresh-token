const { BotAdapter } = require('./botAdapter');
const { Oauth2Client } = require('./oauth2Client');

require('dotenv').config();

// Of course you should use better storage server in production.
const store = new Map();

function saveConversationReference(conversationReference){
    const { aadObjectId } = conversationReference.user;
    console.log(`Saving the conversation with user#${aadObjectId}`);
    store.set(aadObjectId, { conversationReference });
}

function saveTokens(user, tokens){
    console.log(`Associating the conversation with user#${user.id} and his/her access token.`);
    const signedInConversation = store.get(user.id);
    if (!signedInConversation){
        console.log(`saveTokens: Conversation of user#${user.id} not found.`);
        return;
    }
    signedInConversation.tokens = tokens;
    signedInConversation.peerName = user.displayName;
}

async function refreshAndGetAccessToken(signedInConversation){
    const { aadObjectId } = signedInConversation.conversationReference.user;
    console.log(`Checking if I have to refresh the access token of user#${aadObjectId}.`);

    let tokens = Oauth2Client.createToken(signedInConversation.tokens);
    if (tokens.expired()){
        console.log(`User#${aadObjectId}'s access token has been expired. Refreshing.`);
        try {
            tokens = await tokens.refresh({
                scope: process.env.OAUTH_SCOPES
            });
        } catch (error) {
            console.log('Error refreshing access token: ', error);
            return null;
        }
    }
    signedInConversation.tokens = tokens.toJSON();
    console.log(`FINISHED Updating the access token of user#${aadObjectId}.`, signedInConversation);
    return signedInConversation.tokens.access_token;
}

async function withContext(aadObjectId, callback){
    const signedInConversation = store.get(aadObjectId);
    if (!signedInConversation){
        console.log(`withTurnContext: Conversation of user#${aadObjectId} not found.`);
        return;
    }
    console.log(`Retrieving the conversation reference of user#${aadObjectId}.`);
    await BotAdapter.continueConversation(signedInConversation.conversationReference, async turnContext => {
        await callback({ turnContext, signedInConversation });
    });
}

module.exports = { saveTokens, saveConversationReference, refreshAndGetAccessToken, withContext };
