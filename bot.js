const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();
 
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
 
client.on('message', msg => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (msg.content.substring(0, 1) == config.prefix) {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !mirror
            case 'mirror':
				msg.channel.send('asdf');
            break;
         }
     }
});
 
client.login(config.token);
