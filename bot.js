const Discord = require('discord.js');
const client = new Discord.Client();
// var robot = require("robotjs");
var au = require('autoit');
au.Init();

client.once('ready', () => {
	console.log('Ready!');
});


client.login('NzA0NDc0MzgxODc0NzU3NzIy.XqdwVQ.1RtKndSc6sbz4xvhxI4ep_KzcVg');

async function playAudio(audioName, message) {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voice.channel) {
      const connection = await message.member.voice.channel.join();
      const dispatcher = connection.play('./audio/' + audioName + '.mp3', {
          volume: 1.0,
      });
      dispatcher.on('finish', () => {
          console.log("Done playing audio!")
          dispatcher.destroy(); // end the stream
          message.member.voice.channel.leave();
      });
    } else {
      message.reply('You need to join a voice channel first!');
    }
}


client.on('message', async message => {
    // Voice only works in guilds, if the message does not come from a guild,
    // we ignore it
    if (!message.guild) return;
  
    if (message.content === '!crazy') {
        playAudio("thats_crazy", message)
    }

    else if (message.content === '!laughing') {
        playAudio("squad_laughing", message)
    }

    else if (message.content === '!a') {
        // robot.typeString("x");
        // robot.keyTap("enter");
        // ks.sendKey('x');
        au.Send("Hello, autoit & nodejs!");
    }
    else if (message.content === '!b') {
        robot.typeString("z");
    }
    else if (message.content === '!l') {
        robot.keyTap("left");
    }
    else if (message.content === '!r') {
        robot.keyTap("right");
    }
    else if (message.content === '!u') {
        robot.keyTap("up");
    }
    else if (message.content === '!d') {
        robot.keyTap("down");
    }
  });

