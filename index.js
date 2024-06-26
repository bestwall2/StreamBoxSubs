const express = require("express");
const {
    searchForSubM,
    searchForSubTv,
    DownloadByPath,
    AnimeSub
} = require("./SubTools");
const { getStreamUrl } = require("./sanime.js");
const sanitizeFilename = require("sanitize-filename");
const { getSubText, getTvSubs, getMovSubs } = require("./opensubs");
const fs = require("fs").promises;
const path = require("path");
const translateAndSaveSubtitles = require("./SubTrans.js");
const app = express();
const port = 8000;

// Middleware to parse JSON requests
app.use(express.json());

// Middleware for error handling
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({ error: "Internal server error." });
});

app.get("/", (req, res) => {
    res.send("Hi Thanks For Using Stream Box Api ");
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/SearchSubMv", async (req, res) => {
    try {
        const { name, year, language } = req.query;
        if (!name || !year || !language) {
            return res.status(400).json({
                error: "Name, year, and language are required parameters."
            });
        }
        const subtitles = await searchForSubM(name, year, language);
        if (subtitles.length > 0) {
            return res.json(subtitles);
        } else {
            return res.status(404).json({ error: "No matching movie found." });
        }
    } catch (error) {
        console.error("Error searching for subtitles:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get("/SearchSubTv", async (req, res) => {
    try {
        const { name, season, episode, language } = req.query;
        if (!name || !season || !episode || !language) {
            return res.status(400).json({
                error: "Name, season, episode, and language are required parameters."
            });
        }
        const subtitles = await searchForSubTv(name, season, episode, language);
        if (typeof subtitles === "string") {
            return res.status(404).json({ error: subtitles });
        } else if (subtitles.length > 0) {
            return res.json(subtitles);
        } else {
            return res
                .status(404)
                .json({ error: "No matching TV series or episode found." });
        }
    } catch (error) {
        console.error(
            "Error searching for TV series subtitles:",
            error.message
        );
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get("/DownloadSub", async (req, res) => {
    try {
        const { path: subtitlePath } = req.query;
        if (!subtitlePath) {
            return res
                .status(400)
                .json({ error: "Path is a required parameter." });
        }
        const subtitleText = await DownloadByPath(subtitlePath);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(subtitleText);
    } catch (error) {
        console.error("Error downloading subtitles:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get("/GetSubText", async (req, res) => {
    try {
        const { Url } = req.query;
        if (!Url) {
            return res
                .status(400)
                .json({ error: "Url is a required parameter." });
        }
        const subtitleText = await getSubText(Url);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(subtitleText);
    } catch (error) {
        console.error("Error downloading subtitles:", error.message);
        return res
            .status(500)
            .json({ error: "Internal server error." + error.message });
    }
});

app.get("/SubsTv", async (req, res) => {
    try {
        const { imdbId, season, episode, sublanguageId } = req.query;
        if (!imdbId || !season || !episode || !sublanguageId) {
            return res.status(400).json({
                error: "IMDb ID, season, episode, and sublanguageId are required parameters."
            });
        }
        const subtitles = await getTvSubs(
            imdbId,
            season,
            episode,
            sublanguageId
        );
        if (subtitles.length > 0) {
            return res.json(subtitles);
        } else {
            return res
                .status(404)
                .json({ error: "No matching TV series or episode found." });
        }
    } catch (error) {
        console.error(
            "Error searching for TV series subtitles:",
            error.message
        );
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get("/SubsMv", async (req, res) => {
    try {
        const { imdbId, sublanguageId } = req.query;
        if (!imdbId || !sublanguageId) {
            return res.status(400).json({
                error: "IMDb ID and sublanguageId are required parameters."
            });
        }
        const subtitles = await getMovSubs(imdbId, sublanguageId);
        if (subtitles.length > 0) {
            return res.json(subtitles);
        } else {
            return res.status(404).json({ error: "No matching movie found." });
        }
    } catch (error) {
        console.error("Error searching for movie subtitles:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get("/anime/:id/:epNumber", async (req, res) => {
    try {
        const { id, epNumber } = req.params;
        const result_s = await getStreamUrl(id, epNumber);
        const resultJSON =
            typeof result_s === "object" ? JSON.stringify(result_s) : result_s;
        res.send(resultJSON);
    } catch (error) {
        console.error("Error fetching anime details:", error.message);
        res.status(500).json({ error: "Internal server error." + error });
    }
});

app.get("/subs/anime/:id/:epNumber/:lang", async (req, res) => {
    try {
        const { id, epNumber, lang } = req.params;
        const result_s = await AnimeSub(id, epNumber, lang);
        const resultJSON =
            typeof result_s === "object" ? JSON.stringify(result_s) : result_s;
        res.send(resultJSON);
    } catch (error) {
        console.error("Error fetching anime details:", error.message);
        res.status(500).json({ error: "Internal server error." + error });
    }
});
// translate subs rout

app.get('/translateSubtitles', async (req, res) => {
    try {
        const { Url, format, targetLang } = req.query;

        // Validate query parameters
        if (!Url || !format || !targetLang) {
            return res.status(400).json({ error: 'Url, format, and targetLang are required parameters.' });
        }

        // Translate and get the subtitles
        const result = await translateAndSaveSubtitles(Url, format, targetLang);
        // Set appropriate headers for the response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="transSun.${format}"`);
        res.send(result);
    } catch (error) {
        console.error('Error translating subtitles:', error.message);
        return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
