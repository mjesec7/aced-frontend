const fs = require('fs');
let content = fs.readFileSync('d:/ACED/aced-frontend/src/components/Main/AcedSettings.vue', 'utf8');

// Remove the inline style from duration buttons
content = content.replace(/\s*style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; transition: all 0\.2s; font-weight: 500;"/g, '');

fs.writeFileSync('d:/ACED/aced-frontend/src/components/Main/AcedSettings.vue', content);
console.log('AcedSettings.vue fixed!');
