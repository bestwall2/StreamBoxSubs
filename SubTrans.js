const axios = require('axios');
const fs = require('fs');
const { translate } = require('bing-translate-api');
const subsrt = require('subsrt');

async function translateAndSaveSubtitles(url, format, targetLang, batchSize = 5) {
    try {
        // Fetch the subtitle content from the URL
        const response = await axios.get(url, { responseType: 'text' });
        const content = response.data;

        // Parse the subtitle content to JSON
        const options = { verbose: true };
        const jsonSubtitles = subsrt.parse(content, options);

        // Split the subtitle lines into batches
        const batches = [];
        for (let i = 0; i < jsonSubtitles.length; i += batchSize) {
            batches.push(jsonSubtitles.slice(i, i + batchSize));
        }

        // Translate each batch of lines concurrently
        const translatedBatches = await Promise.all(batches.map(batch =>
            translateBatch(batch, targetLang)
        ));

        // Flatten the translated batches
        const translatedTexts = translatedBatches.flat();

        // Update the subtitle lines with the translated texts
        for (let i = 0; i < jsonSubtitles.length; i++) {
            jsonSubtitles[i].text = translatedTexts[i];
            jsonSubtitles[i].content = translatedTexts[i];
        }

        // Convert the translated JSON back to the original subtitle format
        const translatedSubtitles = subsrt.build(jsonSubtitles, { format: format });
        return JSON.stringify(translatedSubtitles, null, 2);
    } catch (error) {
        throw new Error('Error processing subtitle file: ' + error.message);
    }
}

async function translateBatch(batch, targetLang) {
    try {
        // Extract text from the batch
        const texts = batch.map(line => line.text);

        // Translate the batch
        const translations = await Promise.all(texts.map(text => translateText(text, targetLang)));
        console.log(translations);
        return translations;
    } catch (error) {
        console.error('Error translating batch:', error.message);
        // Return the original texts if translation fails
        return batch.map(line => line.text);
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