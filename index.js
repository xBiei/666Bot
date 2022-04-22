// Used --ignore-engines to ignore opus error
// TODO: Find a better quality vol than this shitty ass quality
// TODO: Add more commands and embed replies
// TODO: Add Slash commands
// TODO: If all deaf, pause. vice versa..
// TODO: Rewrite this..
// TODO: just don't forget it

const fs = require('fs');
const Discord = require('discord.js');
require('dotenv').config();
const schedule = require('node-schedule');

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_MESSAGES
  ]
});
const prefix = process.env.prefix;

client.commands = new Map();
// musicQueue = new Map();

client.on('ready', () => {
  console.log(`${client.user.tag}`);
  console.log(`${client.guilds.cache.size} Servers`);
  console.log(`${client.users.cache.size} Members`);
  console.log(`${client.channels.cache.size} Channels`);
  console.log(`[ ${client.guilds.cache.map((g) => g.name).join(', \n ')} ]`);
  console.log("Bot's Up!");
  client.user.setActivity(`What r u looking at, B...?`, { type: 'PLAYING' });

  fs.readdir('./cmds/', (error, files) => {
    if (error) throw error;

    files.forEach((file) => {
      if (!file.endsWith('.js')) return;

      const properties = require(`./cmds/${file}`);

      properties.help.aliases.forEach((alias) => {
        client.commands.set(alias, properties);
      });

      client.commands.set(properties.help.name, properties);
    });
  });
});

client.on('messageCreate', (message) => {
  if (message.content.slice(0, prefix.length) != prefix) return;
  if (message.author.bot) return;

  const embed = new Discord.MessageEmbed().setColor('#000035');
  const args = message.content.substring(3).split(' ');
  const cmd = message.content.substring(3).split(' ').shift();
  const command = client.commands.get(cmd);

  if (command) command.run(client, message, cmd, args, Discord).catch((err) => console.log(err));

  if (!command) {
    return console.log('not found');
  }
});

const upStatus = schedule.scheduleJob('0 15 * * *', function () {
  client.channels.cache
    .get('954906018414989433')
    .send("I'm Still Here..")
    .catch((err) => console.log(err));
});

client.on('error', (err) => {
  console.log('An Error Has Occured in Client: ' + err);
});

client.login(process.env.token);
