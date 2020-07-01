const { BotFrameworkAdapter } = require('botbuilder');
require('dotenv').config();

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
module.exports = {
    BotAdapter: new BotFrameworkAdapter({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword,
        // channelService: process.env.ChannelService,
        // openIdMetadata: process.env.BotOpenIdMetadata
    })
};
