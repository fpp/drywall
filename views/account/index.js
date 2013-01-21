exports.init = function(req, res){
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
        res.locals.isAuthenticated = true;
        res.locals.isActive = req.user.isActive;
        if(typeof req.user.github !== "undefined"){
            res.locals.github = req.user.github;    
        }
        else{
           res.locals.github = false; 
        }
        if(typeof req.user.twitter !== "undefined"){
            res.locals.twitter = req.user.twitter;    
        }
        else{
           res.locals.twitter = false; 
        }        
        res.app.db.models.User.findOne({
            _id: req.user.id
        }, function(err, user) {
            if (err) {
                res.send(500, 'Model findOne error. ' + err);
                return;
            }

            if (req.header('x-requested-with') == 'XMLHttpRequest') {
                console.log('the user for bb-fetch: ' + JSON.stringify(user));
                //res.send(user);
                res.send({
                    data: {
                        record: JSON.stringify(user)
                    }
                });
            }
            else {
                console.log('the user for render: ' + JSON.stringify(user));
                //TODO: send user without the pwd hashes
                res.render('account/index', {
                    data: {
                        record: JSON.stringify(user)
                    }
                });
            }
        });


    }
    else {
        res.redirect('/login');
    }
};


exports.updateaccount = function(req, res){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'username is required';
    }
    else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
    }
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'email is required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'provided email not in recognized format';
    }
    if (!req.body.password) workflow.outcome.errfor.password = 'password is required';
    if (!req.body.confirm) workflow.outcome.errfor.confirm = 'confirm your password';
    if (req.body.password != req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0) return workflow.emit('response');
    
    workflow.emit('duplicateUsernameCheck');
  });
  
  workflow.on('duplicateUsernameCheck', function() {//user.id should come from server
    res.app.db.models.User.findOne({ username: req.body.username, _id: {$ne: req.user.id} }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('duplicateEmailCheck');
    });
  });
  
  workflow.on('duplicateEmailCheck', function() {//user.id should come from server
    res.app.db.models.User.findOne({ email: req.body.email, _id: {$ne: req.user.id} }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }
      
      workflow.emit('confirmPwdCheck');
    });
  });
 
   workflow.on('confirmPwdCheck', function() {
    if (req.body.password != req.body.confirm) {
      workflow.outcome.errfor.confirm = 'Passwords do not match.';
      return workflow.emit('response');
    }
      // check for duplicate email
      workflow.emit('completeUser');    

  });
  
  workflow.on('completeUser', function() {

    //TODO: check in dbs if user is active vs accepting this data from client
    var fieldsToSet = {
      isActive: 'yes',
      username: req.body.username,
      email: req.body.email,
      password: req.app.db.models.User.encryptPassword(req.body.password)
    };
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (req.user.isActive == "yes"){
         workflow.emit('response'); 
      }
      else {
         workflow.outcome.user = user;
         workflow.emit('createAccount');  
      }
      
    });
  });
 
  workflow.on('createAccount', function() {
    res.app.db.models.Account.create({ user: workflow.outcome.user._id}, function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      //update user with account
      workflow.outcome.user.roles.account = account._id;
      workflow.outcome.user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        delete workflow.outcome.user;
        //workflow.emit('logUserIn');
        workflow.emit('sendCompletedSetupEmail');
      });
    });
  });
  
  //TODO change reference to project name
  workflow.on('sendCompletedSetupEmail', function() {
    res.app.utility.email(req, res, {
      from: req.app.get('email-from-name') +' <'+ req.app.get('email-from-address') +'>',
      to: req.body.email,
      subject: 'Your '+ req.app.get('project-name') +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: req.body.username,
        email: req.body.email,
        loginURL: 'http://'+ req.headers.host +'/login/',
        projectName: req.app.get('project-name')
      },
      success: function(message) {
        
        workflow.emit('logUserIn');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending Welcome Email: '+ err);
        workflow.emit('response');
      }
    });
    
    workflow.emit('logUserIn');
  });
  
  workflow.on('logUserIn', function() {
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
        return workflow.emit('response');
      }
      else {
        req.login(user, function(err) {
          if (err) return workflow.emit('exception', err);
          
          workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
          workflow.outcome.user = user;
          workflow.outcome.record = user;
          
          workflow.emit('response');
          
        });
      }
    })(req, res);
  });
  
  //start the workflow
  workflow.emit('validate');
};

exports.update = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    //defaults
    if (!req.body.isActive) req.body.isActive = 'no';
    
    //verify
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
    }

    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0) return workflow.emit('response');
    
    workflow.emit('duplicateUsernameCheck');
  });
  //TODO: use server side user-id vs _id provided from client for security reasons
  workflow.on('duplicateUsernameCheck', function() {
    res.app.db.models.User.findOne({ username: req.body.username, _id: {$ne: req.body._id} }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('duplicateEmailCheck');
    });
  });
  
  workflow.on('duplicateEmailCheck', function() {
      //TODO: use server side user-id vs _id provided from client for security reasons
    res.app.db.models.User.findOne({ email: req.body.email, _id: {$ne: req.body._id} }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.email = 'email already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('patchUser');
    });
  });
  
  workflow.on('patchUser', function() {
    var fieldsToSet = {
      isActive: req.body.isActive,
      username: req.body.username,
      email: req.body.email
    };
    
    req.app.db.models.User.findByIdAndUpdate(req.body._id, fieldsToSet, function(err, user) {
      if (err) return workflow.emit('exception', err);
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.password = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.newPassword) workflow.outcome.errfor.newPassword = 'required';
    if (!req.body.confirm) workflow.outcome.errfor.confirm = 'required';
    if (req.body.newPassword != req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0 || workflow.outcome.errors.length != 0) {
      return workflow.emit('response');
    }
    
    workflow.emit('patchUser');
  });
  
  workflow.on('patchUser', function() {
    var fieldsToSet = {
      password: req.app.db.models.User.encryptPassword(req.body.newPassword)
    };
    //TODO: use server side user-id vs _id provided from client for security reasons
    req.app.db.models.User.findByIdAndUpdate(req.body._id, fieldsToSet, function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.newPassword = '';
      workflow.outcome.confirm = '';
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};

exports.unlinkProvider = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
 
  workflow.on('patchUser', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('User was not found.');
        return workflow.emit('response');
      }
      console.log("User-ID: " + req.params.id);
      console.log("Provider: " + req.params.provider);
      console.log("User: " + JSON.stringify(user[req.params.provider]));
      if(req.params.provider =="twitter"){
        user.twitter = undefined;  
      }
      else if(req.params.provider =="github"){
        user.github = undefined;  
      }
        else {
            // unrecognized authentication provider
        }
      user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        workflow.outcome.user = JSON.stringify(user)
        
        workflow.emit('response');
      });
    });
  });

  //start the workflow
  workflow.emit('patchUser');
};

