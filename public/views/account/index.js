/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  
  app.AccountData = Backbone.Model.extend({
    url: '/account/',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      username: '',
      email: '',
      password: '',
      confirm: '',
      isActive: '',
      dataUpdated: false,
      isAuthenticated: false
    },
    initialize: function(data) {
      this.set(data);
    },
    accountdata: function() {
      this.save(undefined, {
        success: function(model, response, options) {
          if (response.success) {
            model.set({
              errors: [],
              errfor: {},
              dataUpdated: true,
              isActive: 'yes',
              isAuthenticated: true
            });
          }
          else {
            model.set({
              errors: response.errors,
              errfor: response.errfor
            });
          }
        },
        error: function(model, xhr, options) {
          var response = JSON.parse(xhr.responseText);
          model.set({
            errors: response.errors,
            errfor: response.errfor
          });
        }
      });
    }
  });

  app.Identity = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      isActive: '',
      username: '',
      email: ''
    },
    url: function() {
      return '/account/identity/';
    },
    initialize: function(data) {
      this.set(data);
    },
    update: function() {
      this.save(undefined, {});
    }
  });

  app.Password = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      newPassword: '',
      confirm: ''
    },
    url: function() {
      return '/account/password/';
    },
    initialize: function(data) {
      this.set(data);
    },
    password: function() {
      this.save(null, {});
    }
  });
  
/**
 * VIEWS
 **/
  app.AccountDataView = Backbone.View.extend({
    el: '#accountdata',
    template: _.template( $('#tmpl-accountdata').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="confirm"]': 'accountOnEnter',
      'click .btn-accountdata': 'accountdata'
    },
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },

    render: function() {
      var modelData = this.model.toJSON();
      
      //render
      this.$el.html(this.template( modelData ));
      
      //set input values
      for(var key in modelData) {
        this.$el.find('[name="'+ key +'"]').val(modelData[key]);
      }
    },
    
    preventSubmit: function(event) {
      event.preventDefault();
    },
    accountOnEnter: function(event) {
      if (event.keyCode != 13) return;
      if ($(event.target).attr('name') != 'confirm') return;
      this.accountdata(event);
    },
    accountdata: function(event) {
      if (event) event.preventDefault();
      this.model.set({
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val(),
        password: this.$el.find('[name="password"]').val(),
        confirm: this.$el.find('[name="confirm"]').val(),
      });
      this.$el.find('.btn-accountdata').attr('disabled', true);
      this.model.accountdata();
    }
  });

app.IdentityView = Backbone.View.extend({
    el: '#identity',
    template: _.template( $('#tmpl-identity').html() ),
    events: {
      'click .btn-update': 'update'
    },
    update: function() {
      this.model.set({
        isActive: this.$el.find('[name="isActive"]').val(),
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val()
      }, {silent: true});
      
      this.model.update();
    },
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      var modelData = this.model.toJSON();
      
      //render
      this.$el.html(this.template( modelData ));
      
      //set input values
      for(var key in modelData) {
        this.$el.find('[name="'+ key +'"]').val(modelData[key]);
      }
    }
  });

  app.PasswordView = Backbone.View.extend({
    el: '#password',
    template: _.template( $('#tmpl-password').html() ),
    events: {
      'click .btn-password': 'password'
    },
    password: function() {
      this.model.set({
        newPassword: this.$el.find('[name="newPassword"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      }, {silent: true});
      
      this.model.password();
    },
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      var modelData = this.model.toJSON();
      
      //render
      this.$el.html(this.template( modelData ));
      
      //set input values
      for(var key in modelData) {
        this.$el.find('[name="'+ key +'"]').val(modelData[key]);
      }
    }
  });
  
  app.MainView = Backbone.View.extend({
      el: '.page .container',
      initialize: function() {
          var initData = JSON.parse($('#data-record').html());
          if (initData.isActive === 'yes') {
              this.model = new app.Identity({
                  _id: initData._id,
                  isActive: initData.isActive,
                  username: initData.username,
                  email: initData.email
              });
              app.identityView = new app.IdentityView({
                  model: this.model
              });
              app.passwordView = new app.PasswordView({
                  model: new app.Password({
                      _id: initData._id
                  })
              });
          }
          else {
              this.model = new app.AccountData({
                  _id: initData._id,
                  username: initData.username,
                  email: initData.email,
                  password: '',
                  confirm: '',
                  isActive: initData.isActive
              });
              app.accountdataView = new app.AccountDataView({
                  model: this.model
              });
          }

      }
  });
  

/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });

