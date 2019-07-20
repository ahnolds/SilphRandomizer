const Discord = require('discord.js');
const {prefix, seasons} = require('./config.json');
const {token} = require('./auth.json');
const client = new Discord.Client();
 
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
 
client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	
	const args = message.content.slice(prefix.length).split(' ');
	const command = args.shift().toLowerCase();

	switch(command) {
		case 'mirror':
			if (!args.length && Object.keys(seasons).length != 1) {
			return message.channel.send(`Pick a season ${message.author} ${Object.keys(seasons).length}!`);
			}
			message.channel.send('asdf');
		break;
	 }
});
 
client.login(token);
