const axios = require("axios");
const cheerio = require("cheerio");

async function getFilterItemId(TypeName) {
    const lowerCaseTypeName = TypeName ? TypeName.toLowerCase() : "";
    if (lowerCaseTypeName.includes("tv")) {
        return 2;
    } else if (lowerCaseTypeName.includes("movie")) {
        return 1;
    } else if (lowerCaseTypeName.includes("ova")) {
        return 3;
    } else if (lowerCaseTypeName.includes("ona")) {
        return 4;
    } else if (lowerCaseTypeName.includes("finished")) {
        return 1;
    } else if (lowerCaseTypeName.includes("currently")) {
        return 2;
    } else if (lowerCaseTypeName.includes("not")) {
        return 3;
    } else if (lowerCaseTypeName.includes("spring")) {
        return 1;
    } else if (lowerCaseTypeName.includes("summer")) {
        return 2;
    } else if (lowerCaseTypeName.includes("fall")) {
        return 3;
    } else if (lowerCaseTypeName.includes("winter")) {
        return 4;
    } else {
        // Handle other cases or return a default value
        return "";
    }
}

async function getStreamUrl(id = null, ep = null) {
    try {
        const jikanResponse = await axios.get(`https://api.jikan.moe/v4/anime/${id}?lang=en`);
        const parsedData = jikanResponse.data.data;

        if (!parsedData.genres || !Array.isArray(parsedData.genres)) {
            throw new Error("Invalid or missing genres data");
        }

        const engTitle = parsedData.title_english;
        const type = parsedData.type;
        const status = parsedData.status;
        const season = parsedData.season;
        const year = parsedData.year;
        const filteredGenres = parsedData.genres.slice(0, 2).filter(genre => parseInt(genre.mal_id) < 46).map(genre => genre.mal_id);
        const genresString = filteredGenres.join(",");

        const searchFilter = `https://9animetv.to/filter?keyword=${encodeURIComponent(engTitle)}&type=${getFilterItemId(type)}&status=${getFilterItemId(status)}&season=${getFilterItemId(season)}&language=&sort=default&year=${year || ""}&genre=${genresString}`;

        const searchResult = await axios.get(searchFilter);
        const $ = cheerio.load(searchResult.data);
        const filmItems = $(".block_area-anime .flw-item");
        
        if (filmItems.length === 0) {
            return null;
        }

        const firstFilmId = filmItems.first().attr("data-id");
        const epsUrl = `https://9animetv.to/ajax/episode/list/${firstFilmId}`;
        const epsResponse = await axios.get(epsUrl);
        const $$ = cheerio.load(epsResponse.data.html);
        const hrefs = $$(".episodes-ul a.ep-item").map((index, element) => $$(element).attr("href")).get();

        if (hrefs.length === 0) {
            return null;
        }

        return hrefs[ep - 1];
    } catch (error) {
        console.error("Error:", error.message);
        return `Error: ${error.message}`;
    }
}

module.exports = { getStreamUrl };