const subscene = require("node-subscene-api");
const fs = require("fs").promises;

async function searchForSubM(q, year, lang) {
  try {
    const result = await subscene.search(q);
    const filteredResult = result.find((item) => {
      const regex = /\((\d{4})\)/;
      const match = item.title.match(regex);
      const movieYear = match ? match[1] : null;
      return movieYear === year;
    });

    if (filteredResult) {
      const subtitles = await subscene.getSubtitles(filteredResult.path, {});
      const subslang = subtitles[lang] || [];
      return subslang;
    } else {
      return "No matching movie found.";
    }
  } catch (error) {
    console.error("Error fetching subtitles:", error.message);
    throw error; // Re-throw the error if needed
  }
}

async function searchForSubTv(q, season, episode, lang) {
  try {
    console.log("Lang inside function:", lang); // Add this line for debugging

    const result = await subscene.search(
      q + " - " + numberToOrdinalWord(season).replace("Secondnd","Second").replace("Firstst","First") + " Season",
    );
    
    //console.log(result)
    if (result.length > 0) {
      // Filter the results based on the specified season
      /*const filteredResult = result.find((item) => {
        const ordinalInTitle = numberToOrdinalWord(season).replace("Secondnd","-Second").replace("Firstst","-First") + " Season";
        console.log(ordinalInTitle)
        const regex = new RegExp(ordinalInTitle, "i");
        return item.title.toLowerCase().includes(ordinalInTitle.toLowerCase());
      }); */
      //console.log(filteredResult)
      const filteredResult = result[0];
      if (filteredResult) {
        const subtitles = await subscene.getSubtitles(filteredResult.path, {});
        const subslang = subtitles[lang] || [];

        // Filter subslang based on the episode
        const filteredSubs = subslang.filter((sub) => {
          // Assuming the episode number is numeric
          const episodeInTitle1 = `E${episode}`;
          const episodeInTitle2 = `- ${episode}`;
          console.log(episodeInTitle2)
          return sub.title.toLowerCase().includes(episodeInTitle1.toLowerCase()) || sub.title.toLowerCase().includes(episodeInTitle2.toLowerCase() || sub.title.toLowerCase().includes(episode + " [") );
        });

        if (filteredSubs.length > 0) {
          return filteredSubs;
        } else {
          return "No matching episode found.";
        }
      } else {
        return "No matching season found.";
      }
    } else {
      return "No matching TV series found.";
    }
  } catch (error) {
    console.error("Error fetching subtitles:", error.message);
    throw error; // Re-throw the error if needed
  }
}



function numberToOrdinalWord(number) {
    const units = ['Zero', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];
    const teens = ['Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth'];
    const tens = ['Zero', 'Tenth', 'Twentieth', 'Thirtieth', 'Fortieth', 'Fiftieth', 'Sixtieth', 'Seventieth', 'Eightieth', 'Ninetieth'];

    if (number === 0) {
        return units[number];
    } else if (number >= 1 && number <= 9) {
        return units[number];
    } else if (number >= 10 && number <= 19) {
        return teens[number - 10];
    } else if (number % 10 === 0) {
        return tens[number / 10];
    } else {
        const lastDigit = number % 10;
        const suffix = (lastDigit === 1) ? 'st' :
                       (lastDigit === 2) ? 'nd' :
                       (lastDigit === 3) ? 'rd' : 'th';

        return (Math.floor(number / 10) === 2 ? 'Twenty ' : tens[Math.floor(number / 10)] + ' ') + units[lastDigit] + suffix;
    }
}



async function DownloadByPath(path) {
  try {
    const files = await subscene.download(path, { zip: false });

    // Assuming you want to return the content of the first subtitle
    if (files.length > 0) {
      const subtitleText = files[0].file.toString("utf-8"); // Specify utf-8 encoding
      return subtitleText;
    } else {
      return "Error No subtitles found for the specified path.";
    }
  } catch (error) {
    console.error("Error downloading subtitles:", error.message);
    throw error; // Re-throw the error if needed
  }
}
console.log(numberToOrdinalWord(21).replace("Secondnd","Second"));
module.exports = { searchForSubM, DownloadByPath, searchForSubTv };
