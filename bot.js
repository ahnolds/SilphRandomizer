const Discord = require('discord.js');
const {prefix} = require('./config.json');
const seasons = require('./seasons.json');
const client = new Discord.Client();

// https://discordapp.com/api/oauth2/authorize?client_id=601942294433890304&permissions=3072&scope=bot
 
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
 
client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	
	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	switch(command) {
		case 'mirror':
			var seasonNumber = 1
			var valid = true
			if (!args.length) {
				if (seasons.length != 1) {
					valid = false
				}
			} else {
				seasonNumber = Number(args[0])
				if (seasonNumber < 1 || seasonNumber > seasons.length || ! Number.isInteger(seasonNumber)) {
					valid = false
				}
			}
			if (! valid) {
				return message.channel.send(`${message.author}, pick a season (1 to ${seasons.length})!`);
			}
			const season = seasons[seasonNumber - 1];
			const tournament = season[Math.floor(Math.random() * season.length)]
			var s = message.author.toString() + ", you should try " + tournament.name +": Fight with ";
			switch (tournament.types.length) {
				case 0:
					return message.channel.send(`Sorry ${message.author}, no types found for ${tournament.name}!`);
					break;
				case 1:
					s += tournament.types[0];
					break;
				case 2:
					s += tournament.types[0] + " and " + tournament.types[1];
					break;
				default:
					for (var i = 0; i < tournament.types.length - 1; i++) {
						s += tournament.types[i] + ", ";
					}
					s += "and " + tournament.types[tournament.types.length - 1];
					break;
			}
			if ("restrictions" in tournament) {
				s += " (" + tournament.restrictions + ")";
			}
			return message.channel.send(s);
		break;
	 }
});
 
client.login(process.env.BOT_TOKEN);
