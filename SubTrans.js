const axios = require('axios');
const { translate } = require('bing-translate-api');
const subsrt = require('subsrt');

async function translateAndSaveSubtitles(url, format, targetLang) {
    try {
        // Fetch the subtitle content from the URL
        const response = await axios.get(url, { responseType: 'text' });
        const content = response.data;

        // Parse the subtitle content to JSON
        const jsonSubtitles = subsrt.parse(content, { verbose: true });

        // Translate multiple lines with a concurrency limit
        const MAX_CONCURRENCY = 5;
        const translatedTexts = await translateLinesWithConcurrency(jsonSubtitles.map(line => line.text), targetLang, MAX_CONCURRENCY);

        // Update the subtitle lines with the translated texts
        for (let i = 0; i < jsonSubtitles.length; i++) {
            jsonSubtitles[i].text = translatedTexts[i];
            jsonSubtitles[i].content = translatedTexts[i];
        }

        // Convert the translated JSON back to the original subtitle format
        const translatedSubtitles = subsrt.build(jsonSubtitles, { format: format });

        return translatedSubtitles;
    } catch (error) {
        throw new Error('Error processing subtitle file: ' + error.message);
    }
}

async function translateLinesWithConcurrency(lines, targetLang, maxConcurrency) {
    const results = [];
    const queue = [...lines];
    
    async function worker() {
        while (queue.length > 0) {
            const line = queue.shift();
            try {
                const translatedText = await translateText(line, targetLang);
                results.push(translatedText);
            } catch (error) {
                results.push(line); // Add the original line if translation fails
            }
        }
    }

    const workers = Array(maxConcurrency).fill(null).map(() => worker());
    await Promise.all(workers);

    return results;
}

async function translateText(text, targetLang) {
    try {
        const res = "";// await translate(text, null, targetLang);
        return res.translation;
    } catch (error) {
        console.error('Error translating text:', error.message);
        return text; // Return the original text if translation fails
    }
}

module.exports = translateAndSaveSubtitles;