const Discord = require("discord.js");
const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");
const MP3Cutter = require("mp3-cutter");
const ffmpeg = require("fluent-ffmpeg");

const helpers = require("./helpers");
const auth = fs.readFileSync('auth.json');

const client = new Discord.Client();

const MAX_VID_LENGTH = 12000; // Max video length in seconds allowed to download for command convert
const MAX_CLIP_LENGTH = 10;
const CLIP_VOLUME = 0.67;

let allAudioFiles = {};
let georgeCount = 0;
let ericCount = 0;
let isPlaying = false;


client.login(JSON.parse(auth)["token"]);
let mainVoiceChannel;
let mainTextChannel;
let botTextChannel;

async function playAudio(audioName, message, vol, leaveOnEnd = false) {
  // Only try to join the sender's voice channel if they are in one themselves
  if (!isPlaying) {
    if (message.member.voice.channel) {
      // An effective "mutex" that blocks on double calls
      isPlaying = true;
  
      // Count audio uses
      allAudioFiles[audioName] += 1;
      const connection = await message.member.voice.channel.join();
      const dispatcher = connection.play("./audio/" + audioName + ".mp3", {
        volume: vol
      });
      dispatcher.on("finish", () => {
        console.log("Done playing audio!");
        dispatcher.destroy(); // end the stream
        if (leaveOnEnd) {
          message.member.voice.channel.leave();
        }
  
        // Save this object to file
        fs.writeFile("cmds_dict.txt", JSON.stringify(allAudioFiles), function(
          err
        ) {
          if (err) console.log(err);
        });
  
        isPlaying = false;
      });
    } else {
      message.reply("You need to join a voice channel first!");
    }
  }
}

client.once("ready", () => {
  allAudioFiles = JSON.parse(fs.readFileSync("./cmds_dict.txt"));
  georgeCount = JSON.parse(fs.readFileSync("./georgeCount.txt"))["georgeCount"];
  ericCount = JSON.parse(fs.readFileSync("./ericCount.txt"))["ericCount"];
  helpers.updateAudioFiles(allAudioFiles);

  mainVoiceChannel = client.channels.cache.get('211149632951025665');
  mainTextChannel = client.channels.cache.get('785796515712729088');
  botTextChannel = client.channels.cache.get('331234726318833675')

  console.log("Ready!");
});


client.on("message", async message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
  if (!message.guild) return;

  // Take in input arguments
  const prefix = "!";
  const args = message.content.slice(prefix.length).split(" ");
  const command = args.shift().toLowerCase();

  const cmd = message.content.slice(1);

  // Audio clips
  if (message.content === "!help") {
    let helpStr = "";

    // Sort for first five most used commands
    // Create items array
    var items = Object.keys(allAudioFiles).map(function(key) {
      return [key, allAudioFiles[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    });

    // Create a new array with only the first 5 items
    let top_cmds = items.slice(0, 5);

    Object.keys(allAudioFiles).forEach(filename => {
      helpStr += "!" + filename + ", ";
    });
    helpStr = helpStr.slice(0, -2);
    message.channel.send({
      embed: {
        color: 3447003,
        author: {
          name: "CARL BOT",
          icon_url: client.user.avatarURL
        },
        title: "Bruh",
        // url: "https://www.youtube.com/watch?v=jffpcbPMW6Q",
        description: "Evan's Crappy Carl bot",
        fields: [
          {
            name: "Clip Commands",
            value: helpStr
          },
          {
            name: "Most Popular",
            value: top_cmds
          },
          {
            name: "Using !add:",
            value:
              "Use this command like: \n !add YOUTUBE_URL desired_command_name video_start_time duration_in_seconds \n e.g. **!add YOUTUBE_URL ree 1 3** \n Will snip the youtube video from 1 to 4 seconds, and create a new command !ree"
          },
          {
            name: "Using !remove:",
            value:
              'Remove example: "!remove dab" will remove the !dab command'
          }
          //   {
          //     name: "Markdown",
          //     value: "You can put all the *usual* **__Markdown__** inside of them."
          //   }
        ],
        timestamp: new Date(),
        footer: {
          icon_url: client.user.avatarURL,
          text: "© Yeet"
        }
      }
    });
  } else if (message.content === "george sad when") {
    message.channel.send(
      `You have sent ${georgeCount} "george sad when"s across all servers.`,
      {
        files: [
          "https://cdn.discordapp.com/attachments/211149632951025664/784293166634500116/rsz_1garage.png"
        ]
      }
    );
    georgeCount += 1;

    // Save this object to file
    fs.writeFile(
      "georgeCount.txt",
      JSON.stringify({ georgeCount: georgeCount }),
      function(err) {
        if (err) console.log(err);
      }
    );
  } else if (message.content === "eric sad when") {
    message.channel.send(
      `You have sent ${ericCount} "eric sad when"s across all servers.`
    );
    ericCount += 1;

    // Save this object to file
    fs.writeFile(
      "ericCount.txt",
      JSON.stringify({ ericCount: ericCount }),
      function(err) {
        if (err) console.log(err);
      }
    );
  } else if (command === "add") {
    if (!args.length || args.length !== 4) {
      message.channel.send(
        "Use this command like: \n !add YOUTUBE_URL desired_command_name video_start_time duration_in_seconds \n e.g. **!add YOUTUBE_URL ree 1 3** \n Will snip the youtube video from 1 to 4 seconds, and create a new command !ree"
      );
      return;
    }
    // edge case: don't let them name it !add or !help or any existing commands
    let url = args[0];
    let cmd_name = args[1];
    let startTime = args[2];
    let duration = args[3];

    if (parseInt(duration) > MAX_CLIP_LENGTH) {
      message.channel.send(
        "Keep clip less than " + MAX_CLIP_LENGTH + " seconds."
      );
      return;
    } else if (cmd_name === "add" || cmd_name === "help") {
      message.channel.send("yea yea i see you tryna edge case my ass");
      return;
    } else if (cmd_name in allAudioFiles) {
      message.channel.send("Command name already exists.");
      return;
    }

    addClip(url, cmd_name, startTime, duration, message);
  } else if (command === "remove") {
    if (!args.length || args.length !== 1) {
      message.channel.send(
        'Remove example: "!remove dab" will remove the !dab command'
      );
      return;
    }

    let cmdToRemove = args[0];

    if (cmdToRemove in allAudioFiles) {
      fs.unlinkSync(`./audio/${cmdToRemove}.mp3`);
    
      helpers.updateAudioFiles(allAudioFiles);
      message.channel.send(`Command !${cmdToRemove} removed.`);
    }
    else {
      message.channel.send(`There is no command !${cmdToRemove} to be removed.`);
    }
  } else if (cmd in allAudioFiles) {
      try {
        playAudio(cmd, message, CLIP_VOLUME);
        
      }
      catch (e) {
        console.log(e);
      }
  }
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.channelID;
  let oldUserChannel = oldMember.channelID;

  if(newUserChannel === "211149632951025665")
  { 
    if (oldMember.id == '211149463211868160') {
      // helpers.playAudioInSpecificChannel("jail", mainVoiceChannel, CLIP_VOLUME);
    }
  }
})

async function addClip(url, cmdName, startSeconds, duration, message) {
  console.log("Adding an audio clip");

  // Grab the id, removing extraneous youtube url info
  const id = url.split("?v=")[1].split("&")[0];

  ytdl.getInfo(id).then(info => {
    // Check for max video length
    console.log("title:", info.videoDetails.title);
    console.log("video length:", info.videoDetails.lengthSeconds);
    console.log(`duration: ${duration}`, "seconds");

    if (parseInt(info.videoDetails.lengthSeconds) > MAX_VID_LENGTH) {
      message.channel.send(
        "This video is too long for Evan's low-storage Mac to download; pick a video less than " +
          MAX_VID_LENGTH +
          " seconds."
      );
      return;
    }
    message.channel.send("downloading file...");
    clipAndSnip(id, cmdName, startSeconds, duration, message);
  });
}

async function clipAndSnip(id, cmdName, startSeconds, duration, message) {
  let audioFile = `./audio/__${cmdName}.mp3`;
  let newAudioFile = `./audio/${cmdName}.mp3`;

  let stream = ytdl(id, {
    quality: "lowestaudio"
  });

  let start = Date.now();
  ffmpeg(stream)
    .audioBitrate(128)
    .save(audioFile)
    .on("progress", p => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${p.targetSize}kb downloaded`);
    })
    .on("end", () => {
      console.log(
        `\ndone downloading full mp3, splicing - ${(Date.now() - start) /
          1000}s`
      );

      let startSecondsInt = parseInt(startSeconds);
      let endSecondsInt = parseInt(startSeconds) + parseInt(duration);

      MP3Cutter.cut({
        src: audioFile,
        target: newAudioFile,
        start: startSecondsInt,
        end: endSecondsInt
      });

      fs.unlinkSync(audioFile);
      helpers.updateAudioFiles(allAudioFiles);

      message.reply(`finished downloading mp3 file for command !${cmdName}`);
    });
}
