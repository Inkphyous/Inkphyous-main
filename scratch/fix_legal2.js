const fs = require('fs');
let content = fs.readFileSync('lib/LegalData.jsx', 'utf8');

content = content.replace(/INKPHYOUS/g, 'Inkphyous');
content = content.replace(/inkphyous\.com/g, 'Inkphyous.com');
content = content.replace(/www\.Inkphyous\.com/g, 'www.inkphyous.com'); // Restore lowercase in URLs
content = content.replace(/info@Inkphyous\.com/g, 'info@inkphyous.com'); // Restore lowercase in emails
content = content.replace(/href="mailto:info@Inkphyous\.com"/g, 'href="mailto:info@inkphyous.com"'); // Restore lowercase in emails
content = content.replace(/href="https:\/\/www\.Inkphyous\.com"/g, 'href="https:\/\/www.inkphyous.com"'); // Restore lowercase in URLs
// Fix some possible double spacing 
content = content.replace(/  /g, ' ');

fs.writeFileSync('lib/LegalData.jsx', content);
