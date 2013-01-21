/**
* helper functions
**/
function showRow(row_id){
    if (document.getElementById(row_id)) {
		document.getElementById(row_id).style.display = ''; 
	}
}

function hideRow(row_id){
	if (document.getElementById(row_id)) {
		document.getElementById(row_id).style.display = 'none';
	}
}

function toggleRow(row_id){
	if (document.getElementById(row_id)) {
		if (document.getElementById(row_id).style.display == 'none') {
			showRow(row_id)
		} else {
			hideRow(row_id)
		}
	}
}

function format3rdPartyModel(modeldata){
    

      var initData = JSON.parse(modeldata);
      //var initData = modeldata;
     
          if (initData.isActive === 'yes') {
              var twitterData = {},
              githubData={};
              if(typeof initData.twitter == "undefined") {
                   twitterData = {"_id": initData._id, "provider": "twitter", "isSet": "no", "username": "","org_profile": "[not set]"};
              }
              else {
                   twitterData = {"_id": initData._id, "provider": "twitter", "isSet": "yes", "username": initData.twitter.screen_name,"org_profile": "[not set]"};
                   var twProfileKeys = "";
                   for(var key in initData.twitter){
                        twProfileKeys = twProfileKeys + "<span class=\"label\">" + key + "</span>";
                        twProfileKeys = twProfileKeys + "<pre>" + initData.twitter[key] + "</pre>";
                   }
                   twitterData.org_profile = twProfileKeys;
              }
              if(typeof initData.github == "undefined") {
                   githubData = {"_id": initData._id, "provider": "github", "isSet": "no", "username": "","org_profile": "[not set]"};
              }
              else {
                   githubData = {"_id": initData._id, "provider": "github", "isSet": "yes", "username": initData.github.login,"org_profile": "[not set]"};
                   var ghProfileKeys = "";
                   for(var key2 in initData.github){
                        ghProfileKeys = ghProfileKeys + "<span class=\"label\">" + key2 + "</span>";
                        ghProfileKeys = ghProfileKeys + "<pre>" + initData.github[key2] + "</pre>";
                   }
                   githubData.org_profile = ghProfileKeys;
              } 
              return  {"data":[githubData, twitterData]};                      
          }//isActive
}//function

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
      twitter: {},
      github: {},
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
      this.save(undefined, {
        success: function(model, response, options) {
          if (response.success) {
            model.set({
              errors: [],
              errfor: {}
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
    }//update
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


  app.ThirdParty = Backbone.Model.extend({
    urlRoot: '/account/3rdparty/',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      _id: null,
      username: '',
      provider: '',
      isSet: 'no',
      org_profile: ''
    },
    providerUnlink: function(provider,id) {
      this.url = this.urlRoot +'remove/'+ provider +'/'+ id +'/';
      this.save(undefined, {
        success: function(model, response, options) {
          //this.url = this.urlRoot;
          if (response.success) {
                var newData = format3rdPartyModel(response.user);
                app.thirdpartyView.collection.reset(newData.data);
                //console.log("New Data: " + JSON.stringify(newData.data));
          }

        }
      });
      this.url = this.urlRoot;
    },
    
      providerLink: function(provider,id) {
          if(provider === 'twitter'){
            location.href = '/auth/twitter';    
          }
          else if(provider === 'github'){
            location.href = '/auth/github';    
          }
          else {
              //unrecognized provider
          }
    }
    
    
  });
  
  app.ThirdPartyCollection = Backbone.Collection.extend({
    model: app.ThirdParty,
    url: '/account/3rdparty/',
    
    parse: function(services) {  
      return services.data;
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


  app.IdentityView = Backbone.View.extend({
    el: '#identity',
    template: _.template( $('#tmpl-identity').html() ),
    events: {
      'click .btn-update': 'update'
    },
      initialize: function() {
          var initData = JSON.parse($('#data-record').html());
              var twitterData = {},
              githubData={};
              if(typeof initData.twitter == "undefined") {
                   twitterData = {"screen_name": " ", "data": "[not set]"};
              }
              else {
                   twitterData = {"screen_name": initData.twitter.screen_name, "data": "[not set]"};
                   var twProfileKeys = "";
                   for(var key in initData.twitter){
                        twProfileKeys = twProfileKeys + "<span class=\"label\">" + key + "</span>"
                        twProfileKeys = twProfileKeys + "<pre>" + initData.twitter[key] + "</pre>"
                   }
                   twitterData.data = twProfileKeys
              }
              if(typeof initData.github == "undefined") {
                   githubData = {"login": "[not set]", "data": "[not set]"};
              }
              else {
                   githubData = {"login": initData.github.login, "data": "[not set]"};
                   var ghProfileKeys = "";
                   for(var key2 in initData.github){
                        ghProfileKeys = ghProfileKeys + "<span class=\"label\">" + key2 + "</span>"
                        ghProfileKeys = ghProfileKeys + "<pre>" + initData.github[key2] + "</pre>"
                   }
                   githubData.data = ghProfileKeys
              }          
          
          if (initData.isActive === 'yes') {
              this.model = new app.Identity({
                  _id: initData._id,
                  isActive: initData.isActive,
                  username: initData.username,
                  email: initData.email
              });
              this.model.on('change', this.render, this);
              
              app.passwordView = new app.PasswordView({
                  model: new app.Password({
                      _id: initData._id
                  })
              });
              
          }//if
          else {


              this.model = new app.AccountData({
                  _id: initData._id,
                  username: initData.username,
                  email: initData.email,
                  password: '',
                  confirm: '',
                  isActive: initData.isActive,
                  github: githubData,
                  twitter: twitterData                  
              });
              app.accountdataView = new app.AccountDataView({
                  model: this.model
              });
          }//else
          this.render(); 
      },//initialize

      update: function() {
      this.model.set({
        isActive: this.$el.find('[name="isActive"]').val(),
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val()
      }, {silent: true});
      
      this.model.update();
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


  app.ThirdPartyView = Backbone.View.extend({
    el: '#3rdparty-table',
    template: _.template( $('#tmpl-3rdparty-table').html() ),
    initialize: function() {
      this.$el.html(this.template());
      app.thirdpartyView = this;
      var services = format3rdPartyModel($('#data-record').html());
  
      this.collection = new app.ThirdPartyCollection( services.data );
      this.collection.on('reset', this.render, this);
    
     
      this.render();
    },
    render: function() {
      $('#3rdparty-rows').empty();
      
      this.collection.each(function(thirdparty) {
        var view = new app.ThirdPartyRowView({ model: thirdparty });
        $('#3rdparty-rows').append( view.render().$el );
        
        if(thirdparty.attributes.isSet =="yes"){
        var profile_row = "<tr id=\"" + thirdparty.attributes.provider + "\" style=\"display: none;\"><td colspan = \"4\">" + thirdparty.attributes.org_profile + "</td></tr>";
        $('#3rdparty-rows').append( profile_row );
        }
      }, this);

      
    }

  });
  
  app.ThirdPartyRowView = Backbone.View.extend({
    tagName: 'tr',
    template: _.template( $('#tmpl-3rdparty-row').html() ),
    events: {
      'click .btn-remove': 'doRemove',
      'click .btn-add': 'doAdd',
      'click #prof-link-github': 'toggleProfGH',
      'click #prof-link-twitter': 'toggleProfTW'
    },

    doRemove: function() {
        var provider = this.model.attributes.provider;
        var id = this.model.attributes._id;
        this.model.providerUnlink(provider,id);
    },
    doAdd: function() {      
       var provider = this.model.attributes.provider;
        var id = this.model.attributes._id;
        this.model.providerLink(provider,id);
    },
    
     toggleProfGH: function() {
      //location.href = '/auth/github';
      $(this.el.lastChild.childNodes[0]).text((this.el.lastChild.childNodes[0].text != "Show Profile" ? "Show Profile" : "Hide Profile"));
      toggleRow('github');
    },
    toggleProfTW: function() {
      //location.href = '/auth/twitter';
      $(this.el.lastChild.childNodes[0]).text((this.el.lastChild.childNodes[0].text != "Show Profile" ? "Show Profile" : "Hide Profile"));
        toggleRow('twitter');
    },   
    render: function() {
      var str_row = this.template(this.model.toJSON());
      str_row = str_row.replace("icon-github","icon-" + this.model.attributes.provider);
      // we do know the template string so direct str replace should be fine 
      if(this.model.attributes.isSet =="no"){
        str_row = str_row.replace("Remove link","Add link");
        str_row = str_row.replace("btn-remove","btn-add");
        str_row = str_row.replace("btn-warning","btn-success");
        str_row = str_row.replace("Show Profile","");
      }
      else {
              str_row = str_row.replace("prof-link","prof-link-" + this.model.attributes.provider);
              
      }

      this.$el.html( str_row );
      return this;
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
                    
      app.identityView = new app.IdentityView();    
      app.thirdpartyView = new app.ThirdPartyView();
    }
  });

/**
 * ROUTER
 **/
  app.Router = Backbone.Router.extend({
    routes: {
      '': 'default'
    },
    default: function() {
      if (!app.mainView) app.mainView = new app.MainView();
      
      if (!app.isFirstLoad) {
        app.thirdpartyView.collection.fetch();
      }
      
      app.isFirstLoad = false;
    }
  });
  

/**
 * BOOTUP
 **/
$(document).ready(function() {
    app.isFirstLoad = true;
    app.router = new app.Router();
    Backbone.history.start();
  });
