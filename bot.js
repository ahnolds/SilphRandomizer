const Discord = require('discord.js');
const moment = require('moment-timezone');
const {prefix, lockRoleNames} = require('./config.json');
//const {token} = require('./auth.json');
const seasons = require('./seasons.json');
const client = new Discord.Client();

// https://discordapp.com/api/oauth2/authorize?client_id=601942294433890304&permissions=3072&scope=bot
 
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Functions for managing channel write permission
function manageChannel(channel, canWrite, statusMsg) {
	lockRoleNames.forEach(function (roleName) {
		var role = channel.guild.roles.cache.find(role => role.name === roleName);
		channel.updateOverwrite(role, { SEND_MESSAGES: canWrite });
	});
	channel.send(`This channel has been ${statusMsg}!`);
}
function lockChannel(channel, time, unit) {
	if (time === undefined || time == 0) {
		manageChannel(channel, false, "locked");
	} else {
		if (time > 1) {
			unit = `${unit}s`
		}
		manageChannel(channel, false, `locked for ${time} ${unit}`);
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
		case 'unlock': // fall-through
		case 'schedule-lock': // fall-through
		case 'schedule-unlock':
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
				var lockSeconds = 0;
				var unit = "hour"
				var errMsg = `${message.author}, bad arguments provided, options are:\n` +
							 `\t\t"${prefix}lock <time>" to lock for <time> hours\n` +
							 `\t\t"${prefix}lock <time> [days|hours|minutes|seconds]" to lock for the specified interval\n` +
							 `\t\t"${prefix}lock" to lock indefinitely`;
				// Verify arguments
				if (args.length > 2) {
					return message.channel.send(errMsg);
				}
				var lockLength = 0
				if (args.length >= 1) {
					// First argument is the time
					lockLength = Number(args[0])
					if (lockLength < 1 || ! Number.isInteger(lockLength)) {
						return message.channel.send(errMsg);
					}
				}
				if (args.length >= 2) {
					// Second argument is the units with an optional "s"
					if (args[1].endsWith("s")) {
						unit = args[1].slice(0, -1);
					} else {
						unit = args[1];
					}
				}

				// Convert to seconds
				if (unit == "second") {
					lockSeconds = lockLength;
				} else if (unit == "minute") {
					lockSeconds = lockLength * 60;
				} else if (unit == "hour") {
					lockSeconds = lockLength * 60 * 60;
				} else if (unit == "day") {
					lockSeconds = lockLength * 60 * 60 * 24;
				} else {
					return message.channel.send(errMsg);
				}

				// Don't overflow the max time
				if (lockSeconds * 1000 > 2**31 - 1) {
					return message.channel.send(`${message.author}, I can't lock for that long!`);
				}

				// Acutally lock the channel and show the message
				lockChannel(message.channel, lockLength, unit);

				// If the user specified a lock duration, schedule the unlock
				if (lockSeconds != 0) {
					// Convert from seconds to milliseconds and run later
					setTimeout(unlockChannel, lockSeconds * 1000, message.channel)
				}
			} else if (command == 'unlock') {
				// Verify arguments and unlock channel
				if (args.length != 0) {
					return message.channel.send(`${message.author}, the ${prefix}unlock command takes no arguments`);
				}
				unlockChannel(message.channel);
			} else if (command == 'schedule-lock' || command == 'schedule-unlock') {
				var allArgs = message.content.slice(prefix.length + command.length).trim();
				if (allArgs.length < 1) {
					return message.channel.send(`${message.author}, usage: ${prefix}${command} <time to act at>`);
				}
				const now = moment.tz('America/New_York');
				const actTime = moment.tz(allArgs, 'America/New_York');
				if (! actTime.isValid()) {
					return message.channel.send(`${message.author}, I can't understand that date!`);
				}
				if (actTime <= now) {
					return message.channel.send(`${message.author}, pick a time in the future!`);
				}
				if (command == 'schedule-lock') {
					message.channel.send(`Channel will be locked at ${actTime.format('MMMM Do YYYY, h:mm:ss a')}`);
					setTimeout(lockChannel, actTime - now, message.channel);
				} else if (command == 'schedule-unlock') {
					message.channel.send(`Channel will be unlocked at ${actTime.format('MMMM Do YYYY, h:mm:ss a')}`);
					setTimeout(unlockChannel, actTime - now, message.channel);
				}
			}
		break;
	 }
});
 
client.login(process.env.BOT_TOKEN);
//client.login(token);
