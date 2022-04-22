module.exports.run = async (client, msg, cmd, args) => {
  if (msg.author.id !== process.env.owner) return;
  const amount = parseInt(args[0]) + 1;

  if (isNaN(amount)) {
    return msg.reply('is that a number?');
  } else if (amount <= 1 || amount > 100) {
    return msg.reply('you need to input a number between 1 and 99.');
  }
  msg.channel.bulkDelete(amount);
};

module.exports.help = {
  name: 'clear',
  aliases: ['delete']
};
