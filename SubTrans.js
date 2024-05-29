const axios = require('axios');
const fs = require('fs');
const { translate } = require('bing-translate-api');
const subsrt = require('subsrt');

async function translateAndSaveSubtitles(url, format, targetLang) {
    try {
        // Fetch the subtitle content from the URL
        const response = await axios.get(url, { responseType: 'text' });
        let content = response.data;

        // Fix common formatting issues
        content = fixFormattingIssues(content);

        // Parse the subtitle content to JSON
        const options = { verbose: true };
        const jsonSubtitles = subsrt.parse(content, options);

        // Group lines for translation ensuring each group is less than 999 characters
        const translationGroups = groupLinesForTranslation(jsonSubtitles, 999);

        // Translate each group of lines
        const translatedGroups = await Promise.all(translationGroups.map(group =>
            translateText(group.map(line => line.text).join(' '), targetLang)
        ));

        // Reconstruct the translated lines into the original structure
        let translatedIndex = 0;
        for (const group of translationGroups) {
            const translatedGroup = splitText(translatedGroups[translatedIndex], group.length);
            for (let i = 0; i < group.length; i++) {
                group[i].text = translatedGroup[i];
                group[i].content = translatedGroup[i];
            }
            translatedIndex++;
        }

        // Convert the translated JSON back to the original subtitle format
        const translatedSubtitles = subsrt.build(jsonSubtitles, { format: format });
        return translatedSubtitles;
    } catch (error) {
        throw new Error('Error processing subtitle file: ' + error.message);
    }
}

function fixFormattingIssues(content) {
    return content.split('\n').map(line => {
        // Fix incomplete timestamp
        if (line.match(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:/)) {
            line = line.replace(/ --> \d{2}:\d{2}:/, ' --> 00:00:00,000');
        }
        return line;
    }).join('\n');
}

function groupLinesForTranslation(lines, maxLength) {
    const groups = [];
    let currentGroup = [];
    let currentLength = 0;

    for (const line of lines) {
        if (currentLength + line.text.length + 1 > maxLength) { // +1 for space or new line
            groups.push(currentGroup);
            currentGroup = [];
            currentLength = 0;
        }
        currentGroup.push(line);
        currentLength += line.text.length + 1; // +1 for space or new line
    }

    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
}

function splitText(text, numberOfLines) {
    const words = text.split(' ');
    const result = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length + word.length + 1 > text.length / numberOfLines) {
            result.push(currentLine.trim());
            currentLine = '';
        }
        currentLine += word + ' ';
    }
    if (currentLine.length > 0) {
        result.push(currentLine.trim());
    }

    while (result.length < numberOfLines) {
        result.push('');
    }

    return result;
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