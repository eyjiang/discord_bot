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
  
      // Save this object to file
      console.log("Updating commands file");
      fs.writeFile("./cmds_dict.txt", JSON.stringify(allAudioFiles), function(
        err
      ) {
        if (err) console.log(err);
      });
    });
  }

module.exports.updateAudioFiles = updateAudioFiles;