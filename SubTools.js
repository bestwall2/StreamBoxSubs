const subscene = require("node-subscene-api");
const fs = require("fs").promises;
const axios = require("axios");
const cheerio = require("cheerio");
const { getFilterItemId } = require("./sanime.js");

async function searchForSubM(q, year, lang) {
    try {
        const result = await subscene.search(q);
        const filteredResult = result.find(item => {
            const regex = /\((\d{4})\)/;
            const match = item.title.match(regex);
            const movieYear = match ? match[1] : null;
            return movieYear === year;
        });

        if (filteredResult) {
            const subtitles = await subscene.getSubtitles(
                filteredResult.path,
                {}
            );
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
            q +
                " - " +
                numberToOrdinalWord(season)
                    .replace("Secondnd", "Second")
                    .replace("Firstst", "First") +
                " Season"
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
                const subtitles = await subscene.getSubtitles(
                    filteredResult.path,
                    {}
                );
                const subslang = subtitles[lang] || [];

                // Filter subslang based on the episode
                const filteredSubs = subslang.filter(sub => {
                    // Assuming the episode number is numeric
                    const episodeInTitle1 = `E${episode}`;
                    const episodeInTitle2 = `- ${episode}`;
                    console.log(episodeInTitle2);
                    return (
                        sub.title
                            .toLowerCase()
                            .includes(episodeInTitle1.toLowerCase()) ||
                        sub.title
                            .toLowerCase()
                            .includes(
                                episodeInTitle2.toLowerCase() ||
                                    sub.title
                                        .toLowerCase()
                                        .includes(episode + " [")
                            )
                    );
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
    const units = [
        "Zero",
        "First",
        "Second",
        "Third",
        "Fourth",
        "Fifth",
        "Sixth",
        "Seventh",
        "Eighth",
        "Ninth"
    ];
    const teens = [
        "Tenth",
        "Eleventh",
        "Twelfth",
        "Thirteenth",
        "Fourteenth",
        "Fifteenth",
        "Sixteenth",
        "Seventeenth",
        "Eighteenth",
        "Nineteenth"
    ];
    const tens = [
        "Zero",
        "Tenth",
        "Twentieth",
        "Thirtieth",
        "Fortieth",
        "Fiftieth",
        "Sixtieth",
        "Seventieth",
        "Eightieth",
        "Ninetieth"
    ];

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
        const suffix =
            lastDigit === 1
                ? "st"
                : lastDigit === 2
                ? "nd"
                : lastDigit === 3
                ? "rd"
                : "th";

        return (
            (Math.floor(number / 10) === 2
                ? "Twenty "
                : tens[Math.floor(number / 10)] + " ") +
            units[lastDigit] +
            suffix
        );
    }
}

async function DownloadByPath(path) {
    try {
        const files = await subscene.download(path, { zip: false });

        // Check if files array is not empty
        if (files.length > 0) {
            if (files.length === 1) {
                // If there is only one file, return its content
                const subtitleText = files[0].file.toString("utf-8"); // Specify utf-8 encoding
                return subtitleText;
            } else {
                // If there are multiple files, select the last one
                const lastSubtitle =
                    files[files.length - 1].file.toString("utf-8"); // Specify utf-8 encoding
                return lastSubtitle;
            }
        } else {
            return "Error: No subtitles found for the specified path.";
        }
    } catch (error) {
        console.error("Error downloading subtitles:", error.message);
        throw error; // Re-throw the error if needed
    }
}
async function AnimeSub(id = null, ep = null, lang = "arabic") {
    const query = await getItemTitle(id);
    const words = query[0].split(" ");
    const firstTwoWords =
        words.length > 1 ? words.slice(0, 2).join(" ") : query[0];
    if (!query[0]) {
        console.error("Error: Unable to retrieve anime title.");
        return;
    }
    const result = await subscene.search(query[0]);
    const lowercaseQuery = firstTwoWords.toLowerCase();
    const filteredResult = result.filter(
        item =>
            item.title.toLowerCase().includes(lowercaseQuery) ||
            item.title.toLowerCase().includes(query[1])
    );

    // Sort the filtered result based on the year
    filteredResult.sort((a, b) => {
        const yearA = getYearFromTitle(a.title);
        const yearB = getYearFromTitle(b.title);
        return yearB - yearA; // Sort in descending order (latest year first)
    });

    const ALL_LANG_SUBS = await subscene.getSubtitles(
        filteredResult[0].path,
        {}
    );
    const LANG_SUBS = ALL_LANG_SUBS[lang] || [];
    let LANG_SUBS_FILTERED;
    if (ep.includes("0000")) {
        LANG_SUBS_FILTERED = LANG_SUBS;
    } else {
        LANG_SUBS_FILTERED = LANG_SUBS.filter(item => {
            // Extract episode number from the subtitle title
            const subtitleEpNumber = extractEpisodeNumber(item.title);
            // Compare episode numbers and return true if they match
            return subtitleEpNumber === ep;
        });
    }
    const JsStyling = LANG_SUBS_FILTERED.map(item => ({
        FileName: item.title,
        SubFormat: "srt",
        SubDownloadLink: item.path
    }));
    return JsStyling;
}

function getYearFromTitle(title) {
    // Extract the year from the title
    const yearRegex = /\((\d{4})\)/;
    const match = title.match(yearRegex);
    if (match && match[1]) {
        return parseInt(match[1]);
    }
    return 0; // Default to 0 if year not found
}
function extractEpisodeNumber(title) {
    // Match the episode number in the title using regular expression
    const match = title.match(/- (\d+) /); // Assuming episode number is between "- " and " "
    return match ? match[1] : null;
}

async function getItemTitle(id = null) {
    const jk_url = "https://api.jikan.moe/v4/anime/" + id + "?lang=en";

    try {
        const animeData = await axios.get(jk_url);
        const parsedData = animeData.data.data; // Access data property

        if (!parsedData.genres || !Array.isArray(parsedData.genres)) {
            console.error("Error: Invalid or missing genres data");
            return [];
        }

        const title = parsedData.title;
        const eng_title = parsedData.title_english;
        const type = parsedData.type;
        const status = parsedData.status;
        const season = parsedData.season;
        const year = parsedData.year;
        const filteredGenres = parsedData.genres
            .slice(0, 2) // Take only the first two genres
            .filter(genre => parseInt(genre.mal_id) < 46)
            .map(genre => genre.mal_id);
        const genresString = filteredGenres.join(",");
        const search_filter = `https://9animetv.to/filter?keyword=${eng_title.replace(
            /\s/g,
            "+"
        )}&type=${getFilterItemId(type)}&status=${getFilterItemId(
            status
        )}&season=${getFilterItemId(season)}&language=&sort=default&year=${
            year === null ? "" : year
        }&genre=${genresString}`;

        const search_rslt = await axios.get(search_filter);
        const $ = cheerio.load(search_rslt.data);
        const filmSection = $(".block_area-anime");
        const filmItems = filmSection.find(".flw-item");
        const filmData = filmItems
            .map((index, element) => {
                const href = $(element).find(".film-name a").attr("href");
                const title = $(element).find(".film-name a").text();
                const id = $(element).attr("data-id");
                return { href, title, id };
            })
            .get();
        if (filmData.length === 0) {
            return [];
        }

        return [filmData[0].title, "(" + year + ")"];
    } catch (error) {
        console.error("Error:", error.message);
        return [];
    }
}

module.exports = { searchForSubM, DownloadByPath, searchForSubTv, AnimeSub };
