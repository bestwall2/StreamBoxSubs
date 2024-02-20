const request = require("request");
const fs = require("fs");
const zlib = require("zlib");
const iconv = require("iconv-lite");

function getSubText(url) {
  const output = "myfileofsub.txt";
  const encoding = "windows-1256";

  return new Promise((resolve, reject) => {
    request({ url: url, encoding: null }, function (err, resp, body) {
      if (err) return reject(err);

      zlib.gunzip(body, (err, decompressed) => {
        if (err) return reject(err);

        try {
          let decodedText = Buffer.from(decompressed);
          
          if (decodedText.includes("���")) {
            console.log("Subtitles are in UTF-8");
            decodedText = iconv.decode(Buffer.from(decompressed), encoding);
          }

          //fs.writeFileSync(output, decodedText);
          console.log(`File written with encoding: ${encoding}`);
          resolve(decodedText.toString());
        } catch (err) {
          reject(err);
        }
      });
    });
  });
}



function getTvSubs(imdbId, season, episode, sublanguageId) {
  const url = `https://rest.opensubtitles.org/search/episode-${episode}/imdbid-${imdbId}/season-${season}/sublanguageid-${sublanguageId}`;
  const headers = {
    "x-user-agent": "trailers.to-UA",
    "content-type": "application/x-www-form-urlencoded; charset=utf-8"
  };

  return new Promise((resolve, reject) => {
    request({ url, headers }, (error, response, body) => {
      if (error) {
        console.error("Error during request:", error.message);
        return reject(error);
      }

      try {
        const jsonData = JSON.parse(body);

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const subtitlesInfo = jsonData.map((subtitle) => ({
            FileName: subtitle.SubFileName,
            SubFormat: subtitle.SubFormat,
            SubDownloadLink: subtitle.SubDownloadLink,
          }));

          resolve(subtitlesInfo);
        } else {
          resolve([]); // No subtitles found
        }
      } catch (parseError) {
        reject(`Error parsing JSON: ${parseError.message}`);
      }
    });
  });
}

function getMovSubs(imdbId, sublanguageId) {
  const url = `https://rest.opensubtitles.org/search/imdbid-${imdbId}/sublanguageid-${sublanguageId}`;
  const headers = {
    "x-user-agent": "trailers.to-UA",
    "content-type": "application/x-www-form-urlencoded; charset=utf-8"
  };

  return new Promise((resolve, reject) => {
    request({ url, headers }, (error, response, body) => {
      if (error) {
        console.error("Error during request:", error.message);
        return reject(error);
      }

      try {
        const jsonData = JSON.parse(body);

        if (Array.isArray(jsonData)) {
          const subtitlesInfo = jsonData.map((subtitle) => ({
            FileName: subtitle.SubFileName,
            SubFormat: subtitle.SubFormat,
            SubDownloadLink: subtitle.SubDownloadLink,
          }));

          resolve(subtitlesInfo);
        } else {
          console.error("Invalid response format:", body);
          resolve([]); // No subtitles found
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError.message);
        reject(`Error parsing JSON: ${parseError.message}`);
      }
    });
  });
}
 
module.exports = { getSubText, getMovSubs, getTvSubs };