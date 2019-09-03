const Discord = require('discord.js');
const {prefix, lockRoleNames} = require('./config.json');
const seasons = require('./seasons.json');
const client = new Discord.Client();

// https://discordapp.com/api/oauth2/authorize?client_id=601942294433890304&permissions=3072&scope=bot
 
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Functions for managing channel write permission
function manageChannel(channel, canWrite, statusMsg) {
	lockRoleNames.forEach(function (roleName) {
		var role = channel.guild.roles.find(role => role.name === roleName);
		channel.overwritePermissions(role, { SEND_MESSAGES: canWrite });
	});
	channel.send(`This channel has been ${statusMsg}!`);
}
function lockChannel(channel, time) {
	if (time == 0) {
		manageChannel(channel, false, "locked");
	} else {
		manageChannel(channel, false, `locked for ${time} hours`);
	}
}
function unlockChannel(channel) {
	manageChannel(channel, true, "unlocked");
}

function explanationString(tournament) {
	var s = "";
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
	return s;
}
 
client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	
	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	switch(command) {
		case 'mirror':
			var seasonNumber = 1
			var valid = true
			if (args.length > 1) {
				return message.channel.send(`${message.author}, pick a season (1 to ${seasons.length})!`);
			} else if (args.length == 0) {
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
			var s = message.author.toString() + ", you should try " + tournament.name + ": Fight with " + explanationString(tournament);
			return message.channel.send(s);
		break;
		case 'cup':
			if (args.length != 1) {
				return message.channel.send(`${message.author}, give a cup name and I'll explain it!`);
			}
			
			for (var i = 0; i < seasons.length; i++) {
				for (var j = 0; j < seasons[i].length; j++) {
					if (seasons[i][j].name.toLowerCase() == args[0].toLowerCase()) {
						var s = explanationString(seasons[i][j]);
						return message.channel.send(`${message.author}, ${seasons[i][j].name} is ${s}`);
					}
				}
			}
			return message.channel.send(`${message.author}, there isn't a tournament named ${args[0]}!`);
		break;
		case 'lock': // fall-through
		case 'unlock':
			// Make sure we don't try to manage permissions on a DM or other funky thing
			if (message.channel.type != "text") {
				return message.channel.send(`${message.author}, I only manage permissions in guild text channels!`);
			}
			// Verify the user has permission to manage permissions on this channel
			if (! message.member.permissionsIn(message.channel).has('MANAGE_ROLES')) {
				return message.channel.send(`${message.author}, you aren't allowed to do that!`);
			}
			// Verify the bot will actually be able to manage the channel
			if (! message.guild.me.permissionsIn(message.channel).has('MANAGE_ROLES')) {
				return message.channel.send(`${message.author}, I can't manage permissions in this channel!`);
			}
			if (command == 'lock') {
				// Verify arguments and lock channel
				if (args.length > 1) {
					return message.channel.send(`${message.author}, command unknown - "${prefix}lock <time>" to lock for <time> hours, "${prefix}lock" to lock indefinitely`);
				}
				var lockLength = 0
				if (args.length == 1) {
					lockLength = Number(args[0])
					if (lockLength < 1 || lockLength > 48 || ! Number.isInteger(lockLength)) {
						return message.channel.send(`${message.author}, command unknown - "${prefix}lock <time>" to lock for <time> hours, "${prefix}lock" to lock indefinitely`);
					}
				}
				lockChannel(message.channel, lockLength);

				// If the user specified an lock duration, schedule the unlock
				if (args.length == 1) {
					// Convert from hours to milliseconds and run later
					setTimeout(unlockChannel, lockLength * 1000 * 60 * 60, message.channel)
				}
			} else if (command == 'unlock') {
				// Verify arguments and unlock channel
				if (args.length != 0) {
					return message.channel.send(`${message.author}, the ${prefix}unlock command takes no arguments`);
				}
				unlockChannel(message.channel);
			}
		break;
	 }
});
 
client.login(process.env.BOT_TOKEN);
