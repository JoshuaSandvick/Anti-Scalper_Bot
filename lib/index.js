var AmazonBot = require('./amazon_bot.js');
var Promise = require('bluebird');
var fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
		});

console.log('     //\\\\');
console.log('    //  \\\\');
console.log('   //    \\\\');
console.log('  //======\\\\');
console.log(' //        \\\\');
console.log('//          \\\\');
console.log('This is a bot to automatically detect when an item goes on sale on amazon,');
console.log('and then it will log you in, add that item to your cart, and checkout.\n\n');

/* Using the bot files found in the bot_info folder (see example files),
   populate a list with properties for each desired bot */
var botInfoList = [];
fs.readdirSync('./bot_info/').forEach((file) => {
	let botInfo = fs.readFileSync('./bot_info/' + file);
	botInfoList.push(JSON.parse(botInfo));
});

/* Create a bot to use for any of the testing methods */
var bot = createBotFromBotInfo(botInfoList[0]);

function mainLoop()
{
	console.log('OPTIONS:');
	console.log('   1: Login');
	console.log('   2: Buy item');
	console.log('   3. Look for item');
	console.log('   4: Get cart total');
	console.log('   5: Checkout');
	console.log('   6: Logout');
	console.log('   7: Wait for the item to become available, and then buy it');
	console.log('   8: Exit');
	console.log();

	var getChoice = new Promise((resolve, reject) => {
		rl.question('CHOICE: ', resolve);
	});
	getChoice.then(async (choice) => {
		console.log();

		switch(choice) {
			case '1':
				fs.stat('cookies.txt', function(err, stat) {
						if(err == null) {
							console.log('Already logged in!');
							mainLoop();
						} else if(err.code == 'ENOENT') {
							bot
								.login()
								.then((success) => { 
										console.log(success); 
									}, (err) => {
										console.log(err);
									})
								.finally(() => { mainLoop(); });								
						} else {
							console.log(err.code);
							mainLoop();
						}
					});			
				break;				
			case '2':
				fs.stat('cookies.txt', function(err, stat) {
						if(err == null) {
							bot
								.addItem()
								.then((success) => { 
										console.log(success); 
									},
									(err) => { 
										console.log(err);
									})
								.finally(() => { mainLoop(); });						
						} else if(err.code == 'ENOENT') {
							console.log('Can\'t add item to cart if you\'re not logged in!');
							mainLoop();
						} else {
							console.log(err.code);
							mainLoop();
						}
					});
				break;
			case '3':
				try{
					for(i = 0; i < 10; i++) {
						let itemIsReady = await bot.lookForItem();						
						if(itemIsReady) {
							console.log('Item is ready to order!');
							break;
						} else {
							console.log('Item is not ready to order.');
						}
						await delay(7000);
					}					
				} catch(err) {
					console.log(err);
				} finally {
					console.log('Done looking for item.');
					mainLoop();
				}
					
				break;
			case '4':
				fs.stat('cookies.txt', function(err, stat) {
						if(err == null) {
							bot
								.getCartTotal()
								.then((price) => { 
										console.log(price);
									},
									(err) => { 
										console.log(err); 
									})
								.finally(() => { mainLoop(); });
						} else if(err.code == 'ENOENT') {
							console.log('Can\'t get cart total if you\'re not logged in!');
							mainLoop();
						} else {
							console.log(err.code);
							mainLoop();
						}
					});			
				break;
			case '5':
				fs.stat('cookies.txt', function(err, stat) {
						if(err == null) {
							bot
								.checkout()
								.then((success) => { 
										console.log(success); 
									},
									(err) => { 
										console.log(err); 
									})
								.finally(() => { mainLoop(); });
						} else if(err.code == 'ENOENT') {
							console.log('Can\'t checkout if you\'re not logged in!');
							mainLoop();
						} else {
							console.log(err.code);
							mainLoop();
						}
					});			
				break;
			case '6':
				fs.stat('cookies.txt', function(err, stat) {
						if(err == null) {
							bot
								.logout()
								.then((success) => { 
										console.log(success); 
									},
									(err) => { 
										console.log(err); 
									})
								.finally(() => { mainLoop(); });
						} else if(err.code == 'ENOENT') {
							console.log('Can\'t log out if you\'re not logged in!');
							mainLoop();
						} else {
							console.log(err.code);
							mainLoop();
						}
					});			
				break;
			case '7':
				try{
					await waitForItemToBecomeAvailable(botInfoList);
				} catch(err) {
					console.log(err);
				} finally {
					console.log('Done trying to wait for, and then buy, item.');
					mainLoop();
				}					
				break;
			case '8':
				stop();
				break;
			default:
				console.log('Invalid choice!\n\n');
				mainLoop();
				break;
		}
	});
}

/* Close any open processes */
function stop() {
	console.log('Hope you got something good!\n');
	rl.close();
	bot.close();
	process.exit();
}

function delay(duration) {
	return new Promise((resolve) => {setTimeout(resolve, duration);});
}

/* Creates a bot that can interface with Amazon's site */
function createBotFromBotInfo(botInfo) {
	return new AmazonBot.bot('com', 30000, botInfo.username, botInfo.password, botInfo.proxyObject);
}


/* Waits for an item to become available that has its URL hard-coded into the bot code */
function waitForItemToBecomeAvailable(botInfoList) {
	/* The bot that will be used to keep polling for item availability */
	let localBot = createBotFromBotInfo(botInfoList[0]);

	return new Promise(async (resolve, reject) => {
		let itemIsReady = false;

		let currentBotIndex = 0;

		// Loop until the item is available
		let lookTries = 0;
		while(!itemIsReady) {
			try {
				itemIsReady = await localBot.lookForItem();
			} catch(err) {
				console.log(err);
				localBot = createBotFromBotInfo(botInfoList[currentBotIndex]);
			}
			lookTries++;

			if((lookTries % 10) == 0) {
				console.log('Looked for item ' + lookTries + ' times.');
				currentBotIndex = (currentBotIndex + 1) % botInfoList.length;
				localBot = createBotFromBotInfo(botInfoList[currentBotIndex]);
			}

			if(!itemIsReady){
				await delay(15833);
			}
		}

		if(itemIsReady) {
			console.log('ITEM IS READY TO BUY!');

			buyPromises = [];
			for(i = 0; i < botInfoList.length; i++) {
				buyPromises.push(buyItem(botInfoList[i]));
			}
			await Promise.all(buyPromises);
		}

		resolve(itemIsReady);
	});
}

/* Buys the item that has now become available */
function buyItem(botInfo) {
	let localBot = createBotFromBotInfo(botInfo);

	return new Promise(async (resolve, reject) => {
		let loggedIn = false;
		let addedToCart = false;
		let checkedOut = false;

		let currentBotIndex = 0;		

		// Login
		while(!loggedIn) {
			try {
				loggedIn = await localBot.login();
			} catch(err) {
				console.log(err);
				localBot = createBotFromBotInfo(botInfo);
			}

			if(!loggedIn)
			{
				await delay(2000);
			}
		}

		// Add the item to cart if logged in
		if(loggedIn) {
			console.log('Logged in.');
			await delay(5270);

			while(!addedToCart)
			{
				try {
					addedToCart = await localBot.addItem();
				} catch(err) {
					console.log(err);
				}

				if(!addedToCart) {
					await delay(2000);
				}
			}
		}

		// Checkout if the item was successfully added to the cart
		if(addedToCart) {
			console.log('Added item to cart.');
			await delay(4161);

			while(!checkedOut) {
				try {
					checkedOut = await localBot.checkout();
				} catch(err) {
					console.log(err);
				}

				if(!checkedOut) {
					await delay(2000);
				}
			}
		}

		if(checkedOut) {
			console.log('Successfully bought the item!');
			try {
				await localBot.logout();

				console.log('Logged out.');
			} catch(err) {
				console.log(err);
			}
		}

		resolve(checkedOut);
	});
}

// Start the program
mainLoop();