const { codeBlock } = require('@discordjs/builders');

module.exports.run = async (client, msg, cmd, args) => {
  if (msg.author.id !== process.env.owner) return;

  const clean = async (client, text) => {
    if (text && text.constructor.name == 'Promise') text = await text;
    if (typeof text !== 'string') text = require('util').inspect(text, { depth: 1 });

    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203));

    text.replaceAll(client.token, '[REDACTED]');
    return text;
  };

  args.shift();

  const code = args.join(' ');

  try {
    const evaled = eval(code);
    const cleaned = clean(client, evaled);
    const MAX_CHARS = 3 + 2 + clean.length + 3;
    if (MAX_CHARS > 4000) {
      msg.channel.send('Output exceeded 4000 characters. Sending as a file.', {
        files: [{ attachment: Buffer.from(cleaned), name: 'output.txt' }]
      });
    }
    msg.channel.send(codeBlock('js', cleaned));
  } catch (err) {
    console.log(err);
  }
};

module.exports.help = {
  name: 'eval',
  aliases: ['run']
};
