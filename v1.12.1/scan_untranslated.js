const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'resources', 'scripts');
const resultsFile = path.join(__dirname, 'untranslated_strings.log');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.tsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk(srcDir);
const jsxTextRegex = />\s*([^<>{}\n]+?)\s*<\/?[a-zA-Z]/g;
const attrRegex = /(title|placeholder|label|description|content|message|buttonText|confirm)={\s*(['"])(.*?)\2\s*}/g;
const stringAttrRegex = /(title|placeholder|label|description|content|message|buttonText|confirm)=(['"])(.*?)\2/g;

let allMatches = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = file.split('resources\\\\scripts\\\\')[1] || file;

    let match;
    // 1. 尋找 > 純文字 < 的情況
    while ((match = jsxTextRegex.exec(content)) !== null) {
        const text = match[1].trim();
        // 過濾掉太短、只有符號或已經是變數的內容
        if (text.length > 1 && !/^[\d\W]+$/.test(text) && !text.includes('t(')) {
            // 確保它不是程式碼片段
            if (!text.includes('=>') && !text.includes('&&') && !text.includes('||')) {
                allMatches.push({ file: relativePath, text: text, type: 'jsx-text' });
            }
        }
    }

    // 2. 尋找屬性中的 {"文字"} 或 {'文字'}
    while ((match = attrRegex.exec(content)) !== null) {
        const attr = match[1];
        const text = match[3].trim();
        if (text.length > 0 && !text.includes('t(') && !text.includes('${')) {
            allMatches.push({ file: relativePath, text: text, type: `attr-${attr}` });
        }
    }

    // 3. 尋找屬性中的 "文字" 或 '文字'
    while ((match = stringAttrRegex.exec(content)) !== null) {
        const attr = match[1];
        const text = match[3].trim();
        if (text.length > 0 && !text.includes('t(') && !text.includes('${')) {
            allMatches.push({ file: relativePath, text: text, type: `attr-${attr}` });
        }
    }
});

// 過濾掉全英文短字串或特定不會翻譯的字串
const filteredMatches = allMatches.filter(m => {
    const t = m.text;
    if (t === 'true' || t === 'false' || t === 'undefined' || t === 'null') return false;
    if (t === '100%' || /^[\d\.\s%]+$/.test(t)) return false;
    if (t.startsWith('fas ') || t.startsWith('fa-')) return false; // FontAwesome classes
    if (/^[A-Z0-9_]+$/.test(t) && t.length < 5) return false; // 像是 HTTP GET POST
    return true;
});

let report = `找到 ${filteredMatches.length} 個懷疑是硬編碼、未翻譯的文字：\n\n`;
const grouped = {};
filteredMatches.forEach(m => {
    if (!grouped[m.file]) grouped[m.file] = [];
    grouped[m.file].push(`[${m.type}] ${m.text}`);
});

for (const [file, items] of Object.entries(grouped)) {
    report += `檔案: ${file}\n`;
    items.forEach(i => report += `  - ${i}\n`);
    report += `\n`;
}

fs.writeFileSync(resultsFile, report, 'utf8');
console.log(`掃描完成！找到 ${filteredMatches.length} 個項目。結果已寫入 untranslated_strings.log`);
