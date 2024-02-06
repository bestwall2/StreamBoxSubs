const ax = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

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
        // Handle other cases or return a default value
        return "";
    }
}

async function getStreamUrl(id = null, ep = null) {
    let jk_url = "https://api.jikan.moe/v4/anime/" + id + "?lang=en";

    try {
        const animeData = await ax.get(jk_url);
        const parsedData = animeData.data.data; // Access data property

        if (!parsedData.genres || !Array.isArray(parsedData.genres)) {
            console.error("Error: Invalid or missing genres data");
            return "Error: Invalid or missing genres data";
        }

        const title = parsedData.title;
        const eng_title = parsedData.title_english;
        const type = parsedData.type;
        const status = parsedData.status;
        const season = parsedData.season;
        const year = parsedData.year;
        const genres = parsedData.genres.map(genre => genre.mal_id);
        const genresString = genres.join(",").replace(/^46,/, "");
        let search_filter = `https://9animetv.to/filter?keyword=${eng_title.replace(
            /\s/g,
            "+"
        )}&type=${getFilterItemId(type)}&status=${getFilterItemId(
            status
        )}&season=${getFilterItemId(season)}&language=&sort=default&year=${
            year === null ? "" : year
        }&genre=${genresString}`;

        // Do something with search_filter, and return it or another value if needed
        const search_rslt = await ax.get(search_filter);
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
            return null;
        }
        let eps_url = `https://9animetv.to/ajax/episode/list/${filmData[0].id}`;
        const response = await ax.get(eps_url);
        const parsedData2 = response.data;
        //console.log(parsedData2.html);
        // Do not parse again if it's already an object
        const $$ = cheerio.load(parsedData2.html);

        const hrefs = $$(".episodes-ul a.ep-item")
            .map((index, element) => {
                const href = $$(element).attr("href");
                return href;
            })
            .get();
        if (hrefs.length === 0) {
            return null;
        }
        return hrefs[ep - 1];
    } catch (error) {
        console.error("Error:", error.message);
        return "Error:" + error.message;
    }
}

async function KDramaStream(tmdbid=null,se=null,ep=null){

}
module.exports = { getStreamUrl };
