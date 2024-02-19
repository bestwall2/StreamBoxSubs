const axios = require("axios");
const cheerio = require("cheerio");

async function getStreamUrl(id = null, ep = null) {
    const jk_url = "https://api.jikan.moe/v4/anime/" + id + "?lang=en";
    
    try {
        const animeData = await axios.get(jk_url);
        const parsedData = animeData.data.data;

        if (!parsedData.genres || !Array.isArray(parsedData.genres)) {
            throw new Error("Invalid or missing genres data");
        }

        const title = parsedData.title;
        const eng_title = parsedData.title_english;
        const type = parsedData.type;
        const status = parsedData.status;
        const season = parsedData.season;
        const year = parsedData.year;
        const filteredGenres = parsedData.genres
            .slice(0, 2)
            .filter(genre => parseInt(genre.mal_id) < 46)
            .map(genre => genre.mal_id);
        const genresString = filteredGenres.join(",");
        const search_filter = `https://9animetv.to/filter?keyword=${encodeURIComponent(eng_title)}&type=${getFilterItemId(type)}&status=${getFilterItemId(status)}&season=${getFilterItemId(season)}&language=&sort=default&year=${year === null ? "" : year}&genre=${genresString}`;

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
            throw new Error("No anime found");
        }

        const eps_url = `https://9animetv.to/ajax/episode/list/${filmData[0].id}`;
        const response = await axios.get(eps_url);
        const parsedData2 = response.data;
        const $$ = cheerio.load(parsedData2.html);

        const hrefs = $$(".episodes-ul a.ep-item")
            .map((index, element) => $$(element).attr("href"))
            .get();

        if (hrefs.length === 0) {
            throw new Error("No episodes found");
        }

        return hrefs[ep - 1];
    } catch (error) {
        console.error("Error:", error.message);
        return "Error: " + error.message;
    }
}

function getFilterItemId(TypeName) {
    const lowerCaseTypeName = TypeName === null ? "" : TypeName.toLowerCase();
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
        return "";
    }
}

module.exports = { getStreamUrl };