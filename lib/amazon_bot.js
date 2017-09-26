var Promise = require('promise');
var Horseman = require('node-horseman');
var request = require('request-promise').defaults({ encoding: null });
var fs = require('fs');

class AmazonBot {
  constructor(tld, timeout = 50000, username, password, proxyObject = undefined) {
    this.baseUrl = 'https://amazon.' + tld;

    var options = {
      loadImages: false,
      timeout: timeout
    };
	if(proxyObject)
	{
		options.proxy = proxyObject.proxyAddress;
		options.proxyType = 'http';
		options.proxyAuth = proxyObject.proxyUsername + ':' + proxyObject.proxyPassword;
	}
	
    this.horseman = new Horseman(options);
    this.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0';
    this.cookies = [];

    this.urls = {
      login: this.baseUrl + '/ap/signin?_encoding=UTF8&openid.assoc_handle=usflex&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.ns.pape=http%3A%2F%2Fspecs.openid.net%2Fextensions%2Fpape%2F1.0&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F%3Fref_%3Dnav_custrec_signin',
      logout: this.baseUrl + '/gp/flex/sign-out.html/ref=nav_youraccount_signout?ie=UTF8&action=sign-out',
      item: this.baseUrl + '/Super-NES-Classic/dp/B0721GGGS9/ref=sr_1_1?s=videogames&ie=UTF8&qid=1500608751&sr=1-1&keywords=snes+classic',
      cart: this.baseUrl + '/gp/cart/view.html/ref=nav_cart',
      checkout: this.baseUrl + '/gp/buy/spc/handlers/display.html?hasWorkingJavascript=1',
    };
	
	this.username = username;
	this.password = password;
  }

  login() {
    const url = this.urls.login;

    return new Promise((resolve, reject) => {
      let loggedIn = false;
	    var bot = this;

      this.horseman
        .userAgent(this.userAgent)
        .headers({referer: bot.baseUrl})
        .open(url)
        .wait(726)
        .click('input#ap_email')
        .wait(525)
        .type('input#ap_email', this.username)
        .wait(2362)
        .click('input#ap_password')
        .type('input#ap_password', this.password)
        .wait(2171)
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotLoginBeforeClicked.png")
        .click('input#signInSubmit')
        .waitForNextPage()
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotLoginAfterClicked.png")
        .catch((err) => { throw err; })
        .exists('#answer_')
        .then((exists) => {if(exists){ console.log('Filling out security page.'); return fillOutSecurityPage(bot); }})
        .catch((err) => { throw err; })
        .waitForSelector('#nav-your-amazon')
        .count('#nav-your-amazon')
        .then((count) => { if(count > 0) loggedIn = true; })
        .cookies()
        .then((cookies) => {
          this.cookies = cookies;
          resolve(loggedIn);
        })
        .catch((err) => { reject(err);});
    });
  }

  logout() { 
    const url = this.urls.logout;

    return new Promise((resolve, reject) => {
      var horseman = this.horseman;
      var bot = this;

      horseman
        .userAgent(this.userAgent)
        .cookies(this.cookies)
        .headers({referer: bot.urls.cart})
        .open(url)
        .then(() => { horseman.cookies({}); resolve("Logged out successfully!")})
        .catch((err) => { reject(err); });
    });    
  }

  close() {
    return this.horseman
      .close();
  }

  lookForItem() {
    const url = this.urls.item;

    return new Promise((resolve, reject) => {
      this.horseman
        .userAgent(this.userAgent)
        .headers({referer: 'https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=nes'})
        .open(url)
        .catch((err) => { throw err; })
        .waitForNextPage()
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotItemPageOpenedWhenLooking.png")
        .exists('form#addToCart input#add-to-cart-button')
        .then((exists) => {resolve(exists);})
        .catch((err) => { reject(err);});  
    });
  }

  addItem() {
    const url = this.urls.item;
    const baseUrl = this.baseUrl;

    return new Promise(async (resolve, reject) => {
      let itemAmount = 0;

      var horseman = this.horseman;
      var bot = this;
      
      await horseman
        .userAgent(this.userAgent)
        .cookies(this.cookies)
        .headers({referer: 'https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=nes'})
        .open(url)
        .catch((err) => { throw err; })
        .waitForNextPage()
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotItemPageOpened.png")
        .text('#nav-cart-count')
        .then(function(text) { console.log(text); itemAmount = parseInt(text.trim()); })
        .catch((err) => { itemAmount = Infinity; reject(err); });

      if(itemAmount > 0) {
        debugger;
        resolve(true);
      } else {
        this.horseman
          .wait(447)
          .headers({referer: bot.urls.item})
          .click('form#addToCart input#add-to-cart-button')
          .exists('div.a-modal-scroller span#sbbop-no-button a.sbbop-decline')
          .then((exists) => {if(exists) {
            return horseman.click('div.a-modal-scroller span#sbbop-no-button a.sbbop-decline');
          }})
          .catch((err) => { throw err; })
          .waitForNextPage()
          //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotClicked.png")
          .wait(1000)
          .open(baseUrl)
          .catch((err) => { throw err; })
          .waitForNextPage()
          .text('#nav-cart-count')
          .then((text) => {
            let count = parseInt(text.trim());
            resolve(count > itemAmount);
          })
          .catch((err) => { reject(err); });      
      }
    });
  }

  getCartTotal() {
    const url = this.urls.cart;

    return new Promise((resolve, reject) => {
      let total = { price: 0, items: 0, currency: '' };

      this.horseman
        .userAgent(this.userAgent)
        .cookies()
        .headers({referer: 'https://www.amazon.com/ref=nav_logo'})
        .open(url)
        .catch((err) => { throw err; })
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotCartTotalPageOpened.png")
        .waitForSelector('form#activeCartViewForm .sc-subtotal .sc-price')        
        .count('form#activeCartViewForm .sc-list-item')
        .then(function(items) { total.items = items; })
        .text('form#activeCartViewForm .sc-subtotal .sc-price')
        .then(function(price) {
          var price = price.trim().split('$');

          price = price[1].replace(',', '.');
          price = parseFloat(parseFloat(price).toFixed(2));

          if(isNaN(price)) reject('Price is not a number');

          resolve(price);
        })
        .catch((err) => { reject('Had a problem getting the total value of your cart.'); })
    });
  }

  checkout() {
    const url = this.urls.cart;

    return new Promise((resolve, reject) => {
      var bot = this;

      this.horseman
        .userAgent(this.userAgent)
        .cookies(this.cookies)
        .headers({referer: 'https://www.amazon.com/ref=nav_logo'})
        .open(url)
        .catch((err) => { throw err; })
        .waitForNextPage()
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotCartPageOpened.png")
        .wait(2763)
        .headers({referer: bot.urls.cart})
        .click('div.sc-proceed-to-checkout input[name=proceedToCheckout]')
        .catch((err) => { throw err; })
        .waitForNextPage()
        .exists('a[href^="/gp/buy/addressselect/handlers/continue.html/ref=ox_shipaddress_ship"]')
        .then((exists) => { if(exists) {
          debugger;
          return bot.horseman.click('a[href^="/gp/buy/addressselect/handlers/continue.html/ref=ox_shipaddress_ship"]');
        }})        
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotAttemptedToGetToCheckoutPageOpened.png")
        .exists('input#ap_email')
        .then((exists) => { if(exists){ 
            return checkoutLogin(bot)
              .then()
              .catch((err) => { throw err; } );
            }
          })
        .catch((err) => { throw err; })
        //.screenshot("C:/Users/Joshua Sandvick/Documents/NodeJS_Projects/Purchasing_Bot/screenshotFinalCheckoutPageOpened.png")
        .wait(3588)
        .click('div.a-col-left span#submitOrderButtonId input[name=placeYourOrder1], input.place-your-order-button')
        .waitForNextPage()
        .exists('div.containerCSS h2.a-color-success')
        .then((exists) => { resolve(exists); })
        .catch((err) => { reject(err); });
    });
  }

  getBalance() {
    const url = this.urls.redeem;

    return new Promise((resolve, reject) => {
      return this.horseman
        .userAgent(this.userAgent)
        .open(url)
        .waitForSelector('#gc-current-balance')
        .text('#gc-current-balance')
        .then((balance) => {
          var price = balance.replace(',', '.').trim().split(' ');

          if(price.length !== 2) reject('Price could not be parsed');

          price = parseFloat(parseFloat(price[0]).toFixed(2));

          resolve(price);
        });
    });
  }
}

// Private method for filling out the security page
function fillOutSecurityPage(bot) {
	var securityAnswer = '44133';
	
	var horseman = bot.horseman;
		
	return horseman.type('input#dcq_question_subjective_1', securityAnswer)
		.wait(1327)
		.click('input#dcq_submit')
		.waitForNextPage()
    .catch((err) => { console.log('Encountered an error when filling out the security page.'); throw err; })
}

function checkoutLogin(bot) {
  return new Promise((resolve, reject) => {
    bot.horseman
        .wait(1762)
        .type('input#ap_email', bot.username)
        .wait(2677)
        .type('input#ap_password', bot.password)
        .wait(1212)
        .click('input#signInSubmit')
        .waitForNextPage()
        .then(() => { resolve(); })
        .catch((err) => { reject(err); });
  });  
}

exports.bot = AmazonBot;