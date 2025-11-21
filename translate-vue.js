// translate-vue.js - Translate Russian text in Vue.js files to English

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const config = {
  sourceDir: './src',
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
  fileExtensions: ['.vue', '.js'],
  delayBetweenRequests: 500, // ms between requests
};

const stats = {
  filesProcessed: 0,
  stringsTranslated: 0,
  errors: 0,
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function extractRussianStrings(content) {
  const strings = new Set();
  const patterns = [
    /"([^"]*[а-яА-Я][^"]*)"/g,
    /'([^']*[а-яА-Я][^']*)'/g,
    /`([^`]*[а-яА-Я][^`]*)`/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      if (text && text.length < 500) { // Skip very long strings
        strings.add(text);
      }
    }
  });
  
  return Array.from(strings);
}

// Translate using LibreTranslate public API
function translateString(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      q: text,
      source: 'ru',
      target: 'en',
      format: 'text'
    });

    const options = {
      hostname: 'libretranslate.com',
      port: 443,
      path: '/translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.translatedText) {
            resolve(response.translatedText);
          } else {
            reject(new Error('No translation returned'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function translateWithRetry(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const translated = await translateString(text);
      return translated;
    } catch (error) {
      if (i === retries - 1) {
        console.error(`  ⚠ Failed: "${text.substring(0, 30)}..."`);
        stats.errors++;
        return text; // Return original on failure
      }
      console.log(`  ⏳ Retry ${i + 1}/${retries} for: "${text.substring(0, 30)}..."`);
      await sleep(2000 * (i + 1)); // Exponential backoff
    }
  }
  return text;
}

async function translateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const russianStrings = extractRussianStrings(content);
    
    if (russianStrings.length === 0) {
      console.log(`  ⊘ No Russian text found`);
      return null;
    }
    
    console.log(`  📝 Found ${russianStrings.length} Russian strings`);
    
    const translations = {};
    
    for (let i = 0; i < russianStrings.length; i++) {
      const original = russianStrings[i];
      console.log(`  [${i + 1}/${russianStrings.length}] Translating...`);
      
      const translated = await translateWithRetry(original);
      translations[original] = translated;
      
      const preview = original.length > 40 ? original.substring(0, 40) + '...' : original;
      const translatedPreview = translated.length > 40 ? translated.substring(0, 40) + '...' : translated;
      console.log(`    ✓ '${preview}' → '${translatedPreview}'`);
      
      stats.stringsTranslated++;
      await sleep(config.delayBetweenRequests);
    }
    
    // Replace strings in content
    let newContent = content;
    
    for (const [original, translated] of Object.entries(translations)) {
      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      newContent = newContent.replace(
        new RegExp(`"${escapedOriginal}"`, 'g'),
        `"${translated}"`
      );
      newContent = newContent.replace(
        new RegExp(`'${escapedOriginal}'`, 'g'),
        `'${translated}'`
      );
      newContent = newContent.replace(
        new RegExp(`\`${escapedOriginal}\``, 'g'),
        `\`${translated}\``
      );
    }
    
    return newContent;
    
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    stats.errors++;
    return null;
  }
}

async function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (config.excludeDirs.includes(item)) continue;
      await processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (config.fileExtensions.includes(ext)) {
        console.log(`\n📄 Processing: ${fullPath}`);
        
        const translatedContent = await translateFile(fullPath);
        
        if (translatedContent) {
          const backupPath = fullPath + '.backup';
          fs.copyFileSync(fullPath, backupPath);
          fs.writeFileSync(fullPath, translatedContent, 'utf8');
          
          stats.filesProcessed++;
          console.log(`  ✓ Completed and backed up`);
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting Vue.js Translation Script');
  console.log('='.repeat(60));
  console.log(`📁 Source Directory: ${config.sourceDir}`);
  console.log(`🌐 Translation: Russian → English`);
  console.log(`⚙️  Using: LibreTranslate (Free)`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    await processDirectory(config.sourceDir);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Translation Complete!');
    console.log(`📊 Files processed: ${stats.filesProcessed}`);
    console.log(`📝 Strings translated: ${stats.stringsTranslated}`);
    console.log(`⚠ Errors: ${stats.errors}`);
    console.log(`⏱ Duration: ${duration}s`);
    console.log(`💾 Backups created with .backup extension`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();