var passport = require('passport');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.set('X-Auth-Required', 'true');
  res.redirect('/login/?returnUrl='+ encodeURIComponent(req.originalUrl));
}
function ensureAdmin(req, res, next) {
  if (req.user.canPlayRoleOf('admin')) return next();
  res.redirect('/');
}
function ensureAccount(req, res, next) {
  if (req.user.canPlayRoleOf('account')) return next();
  res.redirect('/');
}

exports = module.exports = function(app) {
  //front end
  app.get('/', require('./views/index').init);
  app.get('/about/', require('./views/about/index').init);
  app.get('/contact/', require('./views/contact/index').init);
  app.post('/contact/', require('./views/contact/index').sendMessage);
  
  //sign up
  app.get('/signup/', require('./views/signup/index').init);
  app.post('/signup/', require('./views/signup/index').signup);
  
  //login/out
  app.get('/login/', require('./views/login/index').init);
  app.post('/login/', require('./views/login/index').login);
  app.get('/login/forgot/', require('./views/login/forgot/index').init);
  app.post('/login/forgot/', require('./views/login/forgot/index').send);
  app.get('/login/reset/', require('./views/login/reset/index').init);
  app.get('/login/reset/:token/', require('./views/login/reset/index').init);
  app.put('/login/reset/:token/', require('./views/login/reset/index').set);
  app.get('/logout/', require('./views/logout/index').init);
  
  
  //3rd party authentications
  app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res){
    // The request will be redirected to Twitter for authentication, so this
    // function will not be called.
    console.log('twitter auth: - strange call in authentication');
  });
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
    console.log('the user is active: ' + req.user.isActive );
    console.log('request authenticated: ' + req.isAuthenticated());
    if(req.user.isActive == 'yes'){
       res.redirect(req.user.defaultReturnUrl());
    }
    else {
        res.redirect('/account/');    
    }    
  });

  app.get('/auth/github', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res){
    // The request will be redirected to Twitter for authentication, so this
    // function will not be called.
    console.log('github auth: - strange call in authentication');
  });
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
    console.log('the user is active: ' + req.user.isActive );
    console.log('request authenticated: ' + req.isAuthenticated());
    if(req.user.isActive == 'yes'){
       res.redirect(req.user.defaultReturnUrl());
    }
    else {
        res.redirect('/account/');    
    }    
  });
  
  
  
  
  
  
  //admin
  app.all('/admin*', ensureAuthenticated);
  app.all('/admin*', ensureAdmin);
  app.get('/admin/', require('./views/admin/index').init);
  
  //admin > users
  app.get('/admin/users/', require('./views/admin/users/index').find);
  app.post('/admin/users/', require('./views/admin/users/index').create);
  app.get('/admin/users/:id/', require('./views/admin/users/index').read);
  app.put('/admin/users/:id/', require('./views/admin/users/index').update);
  app.put('/admin/users/:id/password/', require('./views/admin/users/index').password);
  app.put('/admin/users/:id/role-admin/', require('./views/admin/users/index').linkAdmin);
  app.put('/admin/users/:id/role-admin/', require('./views/admin/users/index').linkAdmin);
  app.delete('/admin/users/:id/role-admin/', require('./views/admin/users/index').unlinkAdmin);
  app.put('/admin/users/:id/role-account/', require('./views/admin/users/index').linkAccount);
  app.delete('/admin/users/:id/role-account/', require('./views/admin/users/index').unlinkAccount);
  app.delete('/admin/users/:id/', require('./views/admin/users/index').delete);
  
  //admin > administrators
  app.get('/admin/administrators/', require('./views/admin/administrators/index').find);
  app.post('/admin/administrators/', require('./views/admin/administrators/index').create);
  app.get('/admin/administrators/:id/', require('./views/admin/administrators/index').read);
  app.put('/admin/administrators/:id/', require('./views/admin/administrators/index').update);
  app.put('/admin/administrators/:id/permissions/', require('./views/admin/administrators/index').permissions);
  app.put('/admin/administrators/:id/groups/', require('./views/admin/administrators/index').groups);
  app.put('/admin/administrators/:id/user/', require('./views/admin/administrators/index').linkUser);
  app.delete('/admin/administrators/:id/user/', require('./views/admin/administrators/index').unlinkUser);
  app.delete('/admin/administrators/:id/', require('./views/admin/administrators/index').delete);
  
  //admin > admin groups
  app.get('/admin/admin-groups/', require('./views/admin/admin-groups/index').find);
  app.post('/admin/admin-groups/', require('./views/admin/admin-groups/index').create);
  app.get('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').read);
  app.put('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').update);
  app.put('/admin/admin-groups/:id/permissions/', require('./views/admin/admin-groups/index').permissions);
  app.delete('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').delete);
  
  //admin > accounts
  app.get('/admin/accounts/', require('./views/admin/accounts/index').find);
  app.post('/admin/accounts/', require('./views/admin/accounts/index').create);
  app.get('/admin/accounts/:id/', require('./views/admin/accounts/index').read);
  app.put('/admin/accounts/:id/', require('./views/admin/accounts/index').update);
  app.put('/admin/accounts/:id/user/', require('./views/admin/accounts/index').linkUser);
  app.delete('/admin/accounts/:id/user/', require('./views/admin/accounts/index').unlinkUser);
  app.delete('/admin/accounts/:id/', require('./views/admin/accounts/index').delete);
  
  //admin > search
  app.get('/admin/search/', require('./views/admin/search/index').find);
  
  //account
  app.all('/account*', ensureAuthenticated);
  app.put('/account/*', ensureAccount);
  app.get('/account/', require('./views/account/index').init);
  app.post('/account/', require('./views/account/index').updateaccount);
  app.put('/account/identity/', require('./views/account/index').update);
  app.put('/account/password/', require('./views/account/index').password);
}