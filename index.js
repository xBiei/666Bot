const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Server is up.')
});

app.listen(3000, () => {
  console.log('server started');
});


// TODO: Update this to discord.js 13
// TODO: Find a better quality vol than this shitty ass quality
// TODO: Add more commands and embed replies
// TODO: Add Slash commands
// TODO: If all deaf, pause. vice versa..
// TODO: Rewrite this..
// TODO: just don't forget it 

const Discord = require("discord.js");
const client = new Discord.Client();

const request = require('request');
const prefix = "t6"; 
const GUILDID = '690311241297952847'; 
const CHANNELID = '870833099271966720'; 
let conn // Global dispatcher
let vc // Global vc
client.on("ready", () => {
  console.log(`${client.user.tag}`);
   console.log(`${client.guilds.cache.size} Servers`);
  console.log(`${client.users.cache.size} Members`);
   console.log(`${client.channels.cache.size} Channels`);
  console.log(`[ ${client.guilds.cache.map(g => g.name).join(", \n ")} ]`);
  client.user.setActivity(`What r u looking at, B...?`, { type: "PLAYING" });
});

const ytdl = require('ytdl-core');
const url = 'https://www.youtube.com/watch?v=uQQgZp9Ylbo'; 
  
  function voiceStart(guildid, channelid) {
    if (!guildid) throw new Error('Did u assign guild id?');
    if (!channelid) throw new Error('Did u assign channel id?');
    const guild = client.guilds.cache.get(guildid);
    const voiceChannel = guild.channels.cache.get(channelid);
    vc = voiceChannel
    if (!voiceChannel) {
      return
    }
    voiceChannel.join()
      .then(connection => {
        const stream = ytdl(url, { filter: 'audioonly' }); 
        const dispatcher = connection.play(stream);
        conn = dispatcher
        dispatcher.setVolume(process.env.VOLUME)
        dispatcher.on('end', () => { 
          voiceChannel.leave();

        });
      });
  }

client.on('ready', async () => {
  console.log('Bot\'s Up!');
  voiceStart(GUILDID, CHANNELID);
});


client.on('message', message => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  // ### vol? cmd
    if (message.content == `${prefix} Vol?`) {
    message.reply(`vol is **\`${process.env.VOLUME * 100}%\`**.`)
    }
    // ### leave cmd
    if (message.content == `${prefix} leave`) {
    vc.leave();
      message.reply(`Bye bb.`)
    }
    // ### Join cmd
    if (message.content == `${prefix} join`) {
    message.reply(`Coming Cooooming.`)
    voiceStart(GUILDID, CHANNELID);
    }
    // ### vol cmd
    if (message.content.startsWith(prefix + " vol")) {
    if (message.author.bot) return;
    if (!args[1]) return message.reply(`Did u expect me to read your mind? gimme the vol u want`);
    if (isNaN(args[1]) || args[1] > 100) { 
      return message.reply("Vol can be set between **\`1\`** - **\`100\`**") 
      } else {
        process.env.VOLUME = args[1] / 100
        conn.setVolume(args[1] / 100)
        message.reply(`Done ya bb, vol is **\`${args[1]}%\`**.`)
      }
    }
    // ### restart song cmd
  if (message.content.startsWith(prefix + " again")) {
    if (message.author.bot) return;
    if (!message.channel.guild) return message.reply(' Error : \` Guild Command \`');
  
  function voiceRestart(guildid, channelid) {
    if (!guildid) throw new Error('Did u assign guild id?');
    if (!channelid) throw new Error('Did u assign channel id?');

    let guild = client.guilds.cache.get(guildid);
    const voiceChannel = guild.channels.cache.get(channelid);;
    if (!voiceChannel) {
      return
    }
    voiceChannel.join()
      .then(connection => {
        const stream = ytdl(url, { filter: 'audioonly' });
        const dispatcher = connection.play(stream);
        dispatcher.setVolume(process.env.VOLUME)
        dispatcher.on('end', () => {
          voiceChannel.leave();
        });
      });
    message.channel.send({
      embed: new Discord.MessageEmbed()
        .addField(`starting again.`, true)

    })
  }
   voiceRestart(GUILDID, CHANNELID);
  }
 
});



client.login(process.env.token);