const { withContext, refreshAndGetAccessToken } = require('./signedInConversations');
const { getRecentlyCreatedEvents, getClientWithAccessToken } = require('./graph');

async function sendNotificationTo(aadObjectId){
    await withContext(aadObjectId, async context => {
        const { signedInConversation } = context;
        const accessToken = await refreshAndGetAccessToken(signedInConversation);
        console.log('sendNotificationTo:', { accessToken });
        const events = await getRecentlyCreatedEvents(getClientWithAccessToken(accessToken));
        const header = [`Hi, ${signedInConversation.peerName}, you have created these events recently:`];
        const lines = header.concat(events.map(event => `- ${event.subject}`));
        await context.turnContext.sendActivity(lines.join("\n"));
    });
}

function greetSignedInUserInBackGround(aadObjectId){
    (async () => {
        try {
            await sendNotificationTo(aadObjectId);
        } catch(error) {
            console.log("greetSignedInUserInBackGround: FAILED: ", error);
        }
    })();
}

function notifyLaterInBackground(aadObjectId){
    setInterval(
        async () => {
            try {
                await sendNotificationTo(aadObjectId);
            } catch(error) {
                console.log("notifyLaterInBackground: FAILED: ", error);
            }
        },
        70 * 60 * 1000
    );
}

module.exports = { greetSignedInUserInBackGround, notifyLaterInBackground };
