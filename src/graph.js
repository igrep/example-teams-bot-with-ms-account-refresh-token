// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

var graph = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

module.exports = {
    getUserDetails: async function(client) {
        const user = await client.api('/me').get();
        return user;
    },

    // <GetEventsSnippet>
    getRecentlyCreatedEvents: async function(client) {
        const events = await client
            .api('/me/events')
            .select('subject')
            .orderby('createdDateTime DESC')
            .top(3)
            .get();

        return events.value;
    },
    // </GetEventsSnippet>

    getClientWithAccessToken: function(accessToken) {
        // Initialize Graph client
        return graph.Client.init({
            // Use the provided access token to authenticate
            // requests
            authProvider: (done) => {
                done(null, accessToken);
            }
        });
    },
};
