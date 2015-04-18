exports = module.exports = function(app, passport) {
    var passportLocalStrategy = require('passport-local').Strategy,
        config = require('./config.json'),
        passportTwitterStrategy = require('passport-twitter').Strategy,
        passportGitHubStrategy = require('passport-github').Strategy;


    // passport use local strategy
    passport.use(new passportLocalStrategy(

    function(username, password, done) {
        //lookup conditions
        var conditions = {
            isActive: 'yes'
        };
        if (username.indexOf('@') === -1) {
            conditions.username = username;
        }
        else {
            conditions.email = username;
        }

        app.db.models.User.findOne(conditions, function(err, user) {
            if (err) return done(err);

            if (!user) return done(null, false, {
                message: 'Unknown user'
            });

            //validate password
            var encryptedPassword = app.db.models.User.encryptPassword(password);
            if (user.password != encryptedPassword) {
                return done(null, false, {
                    message: 'Invalid password'
                });
            }

            //we're good
            return done(null, user);
        });
    }));

    // passport use github strategy
    if (config.auth.github.consumerkey.length) {
        passport.use(new passportGitHubStrategy({
            clientID: config.auth.github.consumerkey,
            clientSecret: config.auth.github.consumersecret,
            callbackURL: config.auth.github.callback,
            passReqToCallback: true
        },

        function(req, token, refreshToken, profile, done) {
         if (!req.user) {  
            app.db.models.User.findOne({
                'github.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err)
                }
                if (!user) {
                    console.log('github auth: - user not found');
                    var gh_username = '';
                    var fieldsToSet = {};

                    //TODO: sanitize profile.username / check for allowed characters 
                    //if yes check in dbs - create function to check for existing username in 3rd party passport use
                    app.db.models.User.findOne({
                        'username': profile.username
                    }, function(err, testuser) {
                        if (err) {
                            return done(err)
                        }
                        if (!testuser) {
                            if (/^[a-zA-Z0-9\-\_]+$/.test(profile.username)) {
                                gh_username = profile.username;
                                fieldsToSet = {
                                    isActive: 'no',
                                    username: gh_username,
                                    email: profile.emails[0].value,
                                    github: profile._json
                                };
                                app.db.models.User.create(fieldsToSet, function(err, user) {
                                    if (err) {
                                        return done(err)
                                    }
                                    return done(err, user);
                                });
                            }
                        }
                        else { //username already in dbs
                            fieldsToSet = {
                                isActive: 'no',
                                username: gh_username,
                                email: profile.emails[0].value,
                                github: profile._json
                            };
                            app.db.models.User.create(fieldsToSet, function(err, user) {
                                if (err) {
                                    return done(err)
                                }
                                return done(err, user);
                            });
                        }


                    });


                }
                else {
                    return done(err, user);
                }
            });
         }//!req.user
        else { // is authenticated user we add 3rd party to the user profile
            
        app.db.models.User.findOne({
            _id: req.user._id
        }, function(err, user) {
            if (err) {
                return done(err)
            }
            if (!user) {
                console.log('passport deserialize: - user not found');
                return done(err, req.user);
            }
            else {
                //TODO: check if profile.id already in db
                user.github = profile._json;
                user.save(function(err, user) {
                    if (err) {
                        return done(err);
                        }
                    return done(err, user);
                });
            }
            
        });
      
      return done(null, req.user);  
            
        }// else - is authenticated user we add 3rd party to the user profile
        }));
    }

    // passport use twitter strategy
    if (config.auth.twitter.consumerkey.length) {
        passport.use(new passportTwitterStrategy({
            consumerKey: config.auth.twitter.consumerkey,
            consumerSecret: config.auth.twitter.consumersecret,
            callbackURL: config.auth.twitter.callback,
            passReqToCallback: true
        },

        function(req, token, tokenSecret, profile, done) {

        if (!req.user) {
            app.db.models.User.findOne({
                'twitter.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err)
                }
                if (!user) {
                    console.log('twitter auth: - user not found');
                    var tw_username = '';
                    var fieldsToSet = {};

                    //TODO: sanitize profile.username / check for allowed characters 
                    //if yes check in dbs
                    app.db.models.User.findOne({
                        'username': profile.username
                    }, function(err, testuser) {
                        if (err) {
                            return done(err)
                        }
                        if (!testuser) {
                            if (/^[a-zA-Z0-9\-\_]+$/.test(profile.username)) {
                                tw_username = profile.username;
                                fieldsToSet = {
                                    isActive: 'no',
                                    username: tw_username,
                                    twitter: profile._json
                                };
                                app.db.models.User.create(fieldsToSet, function(err, user) {
                                    if (err) {
                                        return done(err)
                                    }
                                    return done(err, user);
                                });
                            }
                        }
                        else { //username already in dbs
                            fieldsToSet = {
                                isActive: 'no',
                                username: tw_username,
                                twitter: profile._json
                            };
                            app.db.models.User.create(fieldsToSet, function(err, user) {
                                if (err) {
                                    return done(err)
                                }
                                return done(err, user);
                            });
                        }


                    });


                }
                else {
                    return done(err, user);
                }
            });
        }//!req.user
        else {
            
              app.db.models.User.findOne({
            _id: req.user._id
        }, function(err, user) {
            if (err) {
                return done(err)
            }
            if (!user) {
                console.log('passport deserialize: - user not found');
                return done(err, req.user);
            }
            else {
                //TODO: check if profile.id already in db
                user.twitter = profile._json;
                user.save(function(err, user) {
                    if (err) {
                        return done(err);
                        }
                    return done(err, user);
                });
            }
            
        });
      
      return done(null, req.user);

        }
        }));
    }

//--------------------------------------------------------------

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        app.db.models.User.findOne({
            _id: id
        }, function(err, user) {
            if (err) {
                return done(err)
            }
            if (!user) {
                console.log('passport deserialize: - user not found');
                return done(err, user);
            }
            else {
                if (user.isActive == 'no') { //user not active -> has no account in dbs e.g. created from 3rd party auth provider 
                    console.log('passport deserialize: - user without account');
                    return done(err, user);
                }
                else { //user is active -> has account
                    app.db.models.User.findOne({
                        _id: id
                    }).populate('roles.admin').populate('roles.account').exec(function(err, user) {
                        /* 
                         * TODO:
                         * when mongoose supports calling populate on embedded documents,
                         * we can change this code and stop using the '_groups' hack since
                         * assigning direcly to 'groups' doesn't stick right now
                         * https://github.com/LearnBoost/mongoose/issues/601
                         *
                         */

                        if (user.roles && user.roles.admin && user.roles.admin.groups) {
                            app.db.models.AdminGroup.find({
                                _id: {
                                    $in: user.roles.admin.groups
                                }
                            }).exec(function(err, groups) {
                                user.roles.admin._groups = groups;
                                done(err, user);
                            });
                        }
                        else {
                            done(err, user);
                        }
                    });

                }
            }
        });
    });
};
