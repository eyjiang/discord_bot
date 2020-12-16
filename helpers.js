const fs = require("fs");
const audioFolder = "./audio/";

function updateAudioFiles(allAudioFiles) {
    let audioFileSet = new Set();
  
    fs.readdir(audioFolder, (err, files) => {
      files.forEach(file => {
        audioFileSet.add(file.slice(0, -4));
        if (file.slice(-4) == ".mp3") {
          if (!(file.slice(0, -4) in allAudioFiles)) {
            allAudioFiles[file.slice(0, -4)] = 0;
          }
        }
      });
  
      // Remove all commands not in /audi
      for (var cmd in allAudioFiles) {
        if (!audioFileSet.has(cmd)) {
          console.log("removing " + cmd + " command");
          delete allAudioFiles[cmd];
        }
      }

      // Sort the commands alphabetically
      const sortedAudioFiles = {};
      Object.keys(allAudioFiles).sort().forEach(function(key) {
        sortedAudioFiles[key] = allAudioFiles[key];
      });
  
      // Save this object to file
      console.log("Updating commands file");
      fs.writeFile("./cmds_dict.txt", JSON.stringify(sortedAudioFiles), function(
        err
      ) {
        if (err) console.log(err);
      });
    });
  }

  async function playAudioInSpecificChannel(audioName, voiceChannel, vol, leaveOnEnd = true) {
    const connection = await voiceChannel.join();
    const dispatcher = connection.play("./audio/" + audioName + ".mp3", {
      volume: vol
    });
    dispatcher.on("finish", () => {
      console.log("Done playing audio!");
      dispatcher.destroy(); // end the stream
      if (leaveOnEnd) {
        voiceChannel.leave();
      }
    });
  }

module.exports.updateAudioFiles = updateAudioFiles;
module.exports.playAudioInSpecificChannel = playAudioInSpecificChannel;