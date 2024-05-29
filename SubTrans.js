const axios = require('axios');
const fs = require('fs');
const { translate } = require('bing-translate-api');
const subsrt = require('subsrt');

async function translateAndSaveSubtitles(url, format, outputJsonFile, outputSubtitleFile, targetLang) {
    try {
        // Fetch the subtitle content from the URL
        const response = await axios.get(url, { responseType: 'text' });
        const content = response.data;

        // Parse the subtitle content to JSON
        const options = { verbose: true };
        const jsonSubtitles = subsrt.parse(content, options);

        // Translate multiple lines concurrently
        const translationPromises = jsonSubtitles.map(line => translateText(line.text, targetLang));
        const translatedTexts = await Promise.all(translationPromises);

        // Update the subtitle lines with the translated texts
        for (let i = 0; i < jsonSubtitles.length; i++) {
            jsonSubtitles[i].text = translatedTexts[i];
            jsonSubtitles[i].content = translatedTexts[i];
        }

        // Save the translated JSON to a file
       // fs.writeFileSync(outputJsonFile, JSON.stringify(jsonSubtitles, null, 2), 'utf8');

        // Convert the translated JSON back to the original subtitle format
        const translatedSubtitles = subsrt.build(jsonSubtitles, { format: format });
       // fs.writeFileSync(outputSubtitleFile, translatedSubtitles, 'utf8');

        return translatedSubtitles ;
    } catch (error) {
        throw new Error('Error processing subtitle file: ' + error.message);
    }
}

async function translateText(text, targetLang) {
    try {
        const res = await translate(text, null, targetLang);
        return res.translation;
    } catch (error) {
        console.error('Error translating text:', error.message);
        return text; // Return the original text if translation fails
    }
}

module.exports = translateAndSaveSubtitles;