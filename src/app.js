// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var flash = require('connect-flash');

const { EchoBot } = require('./bot');
const { saveTokens } = require('./signedInConversations');
const { BotAdapter } = require('./botAdapter');
const { Oauth2Client } = require('./oauth2Client');
const { greetSignedInUserInBackGround, notifyLaterInBackground } = require('./backgroundNotifier');

require('dotenv').config();

var passport = require('passport');
var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

// Configure passport

// In-memory storage of logged-in users
// For demo purposes only, production apps should store
// this in a reliable storage
var users = {};

// Passport calls serializeUser and deserializeUser to
// manage users
passport.serializeUser(function(user, done) {
    console.log("Serializing user: ", user);
    // Use the OID property of the user as a key
    users[user.profile.oid] = user;
    done (null, user.profile.oid);
});

passport.deserializeUser(function(id, done) {
    console.log("Deserializing user: ", { id });
    done(null, users[id]);
});

// Callback function called once the sign-in is complete
// and an access token has been obtained
// <SignInCompleteSnippet>
async function signInComplete(_iss, _sub, profile, accessToken, _refreshToken, params, done) {
    if (!profile.oid) {
        return done(new Error("No OID found in user profile."));
    }

    try{
        const user = await graph.getUserDetails(graph.getClientWithAccessToken(accessToken));

        if (user) {
            // Add properties to profile
            profile['email'] = user.mail ? user.mail : user.userPrincipalName;
            saveTokens(user, params);
            greetSignedInUserInBackGround(profile.oid);
            notifyLaterInBackground(profile.oid);
        }
    } catch (err) {
        return done(err);
    }

    // Create a simple-oauth2 token from raw tokens
    const oauthToken = Oauth2Client.createToken(params);

    console.log("signedInComplete", { params, profile });

    // Save the profile and tokens in user storage
    users[profile.oid] = { profile, oauthToken };
    return done(null, users[profile.oid]);
}
// </SignInCompleteSnippet>

// Configure OIDC strategy
passport.use(new OIDCStrategy(
    {
        identityMetadata: `${process.env.OAUTH_AUTHORITY}${process.env.OAUTH_ID_METADATA}`,
        clientID: process.env.OAUTH_APP_ID,
        responseType: 'code',
        responseMode: 'form_post',
        redirectUrl: `${process.env.ORIGIN_URL}/auth/callback`,
        allowHttpForRedirectUrl: true,
        clientSecret: process.env.OAUTH_APP_PASSWORD,
        validateIssuer: false, // TODO this should be true in production.
        passReqToCallback: false,
        scope: process.env.OAUTH_SCOPES.split(' ')
    },
    signInComplete
));

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var graph = require('./graph');

var app = express();

// <SessionSnippet>
// Session middleware
// NOTE: Uses default in-memory session store, which is not
// suitable for production
app.use(session({
    secret: 'your_secret_value_here',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy'
}));

// Flash middleware
app.use(flash());

// Set up local vars for template layout
app.use(function(req, res, next) {
    // Read any flashed errors and save
    // in the response locals
    res.locals.error = req.flash('error_msg');

    // Check for simple error string and
    // convert to layout's expected format
    var errs = req.flash('error');
    for (var i in errs){
        res.locals.error.push({message: 'An error occurred', debug: errs[i]});
    }

    next();
});
// </SessionSnippet>

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// <FormatDateSnippet>
var hbs = require('hbs');
var moment = require('moment');
// Helper to format date/time sent by Graph
hbs.registerHelper('eventDateTime', function(dateTime){
    return moment(dateTime).format('M/D/YY h:mm A');
});
// </FormatDateSnippet>

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// <AddProfileSnippet>
app.use(function(req, res, next) {
    // Set the authenticated user in the
    // template locals
    if (req.user) {
        res.locals.user = req.user.profile;
    }
    next();
});
// </AddProfileSnippet>

app.use('/', indexRouter);
app.use('/auth', authRouter);

// Catch-all for errors.
BotAdapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error("\n [onTurnError] unhandled error:", error);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encounted an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Create the main dialog.
const myBot = new EchoBot();

// Listen for incoming requests.
app.post('/api/messages', (req, res) => {
    BotAdapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.run(context);
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
