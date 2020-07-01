// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

require('dotenv').config();

const { CardFactory, ActivityHandler, TurnContext } = require('botbuilder');

const { saveConversationReference } = require('./signedInConversations');

const card = CardFactory.adaptiveCard({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.0",
    body: [
        {
            "type": "TextBlock",
            "text": "Hello, and welcome!"
        }
    ],
    actions: [
        {
            type: "Action.OpenUrl",
            title: "Sign in with Microsoft Account",
            url: `${process.env.ORIGIN_URL}/auth/signin`
        }
    ]
});

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            await context.sendActivity({ attachments: [card] });
            saveConversationReference(TurnContext.getConversationReference(context.activity));

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity({ attachments: [card] });
                    saveConversationReference(TurnContext.getConversationReference(context.activity));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
