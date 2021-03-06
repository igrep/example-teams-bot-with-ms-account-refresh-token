// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

var express = require('express');
var passport = require('passport');
var router = express.Router();

/* GET auth callback. */
router.get('/signin',
    function  (req, res, next) {
        passport.authenticate('azuread-openidconnect',
            {
                response: res,
                prompt: 'login',
                failureRedirect: '/',
                failureFlash: true,
                successRedirect: '/auth/success'
            }
        )(req,res,next);
    }
);

// <CallbackRouteSnippet>
router.post('/callback',
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect',
            {
                response: res,
                failureRedirect: '/',
                failureFlash: true,
                successRedirect: '/auth/success'
            }
        )(req,res,next);
    }
);
// </CallbackRouteSnippet>

router.get('/signout',
    function(req, res) {
        req.session.destroy(function(err) {
            req.logout();
            res.redirect('/');
        });
    }
);

router.get('/success',
    function(_req, res) {
        res.render('success');
    }
);

module.exports = router;
