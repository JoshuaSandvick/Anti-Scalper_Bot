# Anti-Scalper_Bot

This is a project that arose out of a need for busy people to be able to get limited-stock items without paying a ridiculous markup to scalpers. 
The bot uses HorsemanJS to create a workflow that will determine if an item is available for purchase, and then the bot will buy that item for you.
It was designed with the hope of putting as little strain on website's servers as possible, and so please do NOT alter the duration of sleeps for checking the server to see if the item is available to be too small. On the same token, keep the amount of proxy servers that are used to an absolute minimal level. After all, if you are using this bot in the way that it is intended, you should only be buying enough copies of an item for you and maybe a friend or family member.

The main starting file for the bot workflow is in lib/index.js.

An example workflow for a particular site has been set up for you. If you would like to make it work for different sites, you will need to create a bot very similar to the one that was provided that is designed for that site's workflow instead.
I believe that the workflows for e-commerce sites are generally very similar, and so the functions that are in the example bot script are probably going to be similar to what you need on any site that you might want to buy from.
