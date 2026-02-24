const fs = require('fs');
const path = require('path');

const files = [
    'v1.12.1/resources/locales/zh.json',
    'v1.12.1/resources/locales/en.json'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        console.log(`PASS: ${file} is valid JSON`);
    } catch (e) {
        console.error(`FAIL: ${file} is invalid JSON: ${e.message}`);
    }
});
