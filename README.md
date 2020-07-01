# Example Microsoft Teams bot saving the refresh token of the signed-in user

One solution for [botframework - Get refresh tokens of Microsoft Graph API with OAuthPrompt - Stack Overflow](https://stackoverflow.com/questions/62441914/get-refresh-tokens-of-microsoft-graph-api-with-oauthprompt).

## The problem

To make a Microsoft Teams bot which uses the Microsoft account of the peer (the user who talks with the bot), we usually use [`OAuthPrompt` class of the botbuilder-dialogs library](https://docs.microsoft.com/en-us/javascript/api/botbuilder-dialogs/oauthprompt?view=botbuilder-ts-latest). This class makes it very easy to implement a "Sign-in with Microsoft account" feature. But this is too inflexible to customize: almost any process for OAuth2-related tasks are done on Teams itself.

Due to the limitation of `OAuthPrompt`, we cannot get a `refresh_token` to update the `access_token` of the signed-in peer to keep the signed-in state. This disables us from implementing some features depending on periodical background checking of the peer's Microsoft account information. For example, with `OAuthPrompt`, we can't implement a bot which checks the peer's Outlook calendar periodically to send notifications of the events.

## How this works

To implement "Sign-in with Microsoft account" feature without `OAuthPrompt`, I created a tiny web app just to provide the sign-in feature along with the bot. The bot and the web app cooperate by the following flow:

1. The bot sends the sign-in URL of the web app to the peer user.
    - Then the bot saves the conversation reference with the peer to remember the peer's `aadObjectId` in it.
1. The peer signs in with his/her Microsoft account via the URL sent by the bot.
1. After the peer finishes to sign in, the web app associate with the signed-in user's `oid` (which looks the same type with `aadObjectId`), access token, and refresh token, with the conversation reference saved by the bot.
1. Now the bot can look up the peer's access token and refresh token, as well as the conversation reference by the peer's `aadObjectId`!.

## Running the example bot

1. Install Node.js (The tested major version is 12).
1. Make a `.env` file by copying and editing `.env.example`.
    - To get `MicrosoftAppId` and `MicrosoftAppPassword`, follow the instructions in [Create a bot for Microsoft Teams - Teams | Microsoft Docs](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-for-teams).
    - To get `OAUTH_APP_ID` and `OAUTH_APP_PASSWORD`, follow the instructions in [Build Node.js Express apps with Microsoft Graph - Microsoft Graph | Microsoft Docs](https://docs.microsoft.com/en-us/graph/tutorials/node?tutorial-step=3).
1. Then run the app:  
  ```bash
  npm install
  npm run start
  ```

## Caveat

This example doesn't work in the following cases:

- The bot joins in a chat with several people: This bot only supports 1-to-1 chats.
- There are several 1-1 chats where the bot and the signed-in user join.
    - (I'm not sure we can actually have such chats).


# Original License

This project is a fork of [microsoftgraph/msgraph-training-nodeexpressapp](https://github.com/microsoftgraph/msgraph-training-nodeexpressapp). Here is the original copyright notice:

```
Copyright (c) 2018 Microsoft Graph

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
