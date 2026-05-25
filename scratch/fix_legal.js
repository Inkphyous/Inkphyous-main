const fs = require('fs');
let content = fs.readFileSync('lib/LegalData.jsx', 'utf8');

// Replace **text** with <strong>text</strong>
content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// Fix leading spaces in titles
content = content.replace(/title: \" /g, 'title: \"');

fs.writeFileSync('lib/LegalData.jsx', content);
