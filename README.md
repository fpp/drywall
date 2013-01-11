
This is a fork of Drywall
------------

(for info on the original project see the Drywall project page: http://jedireza.github.com/drywall/ )

This fork adds 3rd party authentication (twitter, github) for signup and login.
Also includes account / settings editing by user

TODO:
- format / enhance display of 3rd party jason on account page
- allow association of new 3rd party id with existing account
- allow removal of 3rd party id from existing account


Installation
------------

 1. Download and unzip (or git clone) into a directory.
 2. Run "$ npm install"
 3. Configure /app.js with mongodb and email credentials.
 4. Configure config_example.json with 3rd party IDs / tokens and save as config.json
 5. Run app via "$ node app"

Note: To use the application with 3rd party authentication services locally access the app via 127.0.0.1:3000 (vs. localhost:3000). Otherwise the authentication callbacks will not work.

Setup
------------

You need a few records in the database to start using the user system.

Run these commands on mongo. *Obviously you should use your email address.

```js
db.admingroups.save({ name: 'root' });
var rootGroup = db.admingroups.findOne();
db.admins.save({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: [rootGroup._id] });
var rootAdmin = db.admins.findOne();
db.users.save({ username: 'root', isActive: 'yes', email: 'your@email.addy', roles: {admin: rootAdmin._id} });
var rootUser = db.users.findOne();
rootAdmin.user = rootUser._id;
db.admins.save(rootAdmin);
```

Now just use the reset password feature to set a password.

 * http://localhost:3000/login/forgot/
 * Submit your email address and wait a second.
 * Go check your email and get the reset link.
 * http://localhost:3000/login/reset/:token/
 * Set a new password.

Login. Customize. Enjoy.
