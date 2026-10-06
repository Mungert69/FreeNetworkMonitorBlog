// Data-only cleanup: no table, column or index changes. Review before importing.
const fs = require('node:fs');
const path = require('node:path');
const catalogue = require('../config/blog-categories.json');
const literal = text => `CONVERT(0x${Buffer.from(text,'utf8').toString('hex')} USING utf8mb4)`;
const sql = [
  '-- Generated from config/blog-categories.json; data-only and safe to repeat.',
  '-- Back up Blogs, BlogCategories, BlogQNAs and BlogPictures before applying.',
  'START TRANSACTION;',
  "UPDATE Blogs SET IsPublished=0,IsOnBlogSite=0,IsFeatured=0,IsMainFeatured=0 WHERE Hash REGEXP '^(default[0-9]*|[0-9]+)$' OR Title='Welcome Blog';",
  "UPDATE Blogs SET Markdown=REPLACE(Markdown,'https://freenetworkmonitor.click/download','https://readyforquantum.com/download'), Header=REPLACE(Header,'https://freenetworkmonitor.click/download','https://readyforquantum.com/download');",
  "UPDATE BlogQNAs SET Question=REPLACE(Question,'https://freenetworkmonitor.click/download','https://readyforquantum.com/download'), Answer=REPLACE(Answer,'https://freenetworkmonitor.click/download','https://readyforquantum.com/download');",
];
for (const [label, aliases] of Object.entries(catalogue)) {
  for (const alias of aliases) {
    if (label === alias) continue;
    for (const table of ['BlogCategories','BlogPictures']) {
      sql.push(`UPDATE ${table} SET Category=${literal(label)} WHERE Category=${literal(alias)};`);
    }
  }
}
sql.push('DELETE duplicate FROM BlogCategories duplicate JOIN BlogCategories retained ON retained.BlogID=duplicate.BlogID AND retained.Category=duplicate.Category AND retained.ID<duplicate.ID;');
sql.push('COMMIT;');
fs.writeFileSync(path.join(__dirname,'blog-source-cleanup.sql'),sql.join('\n')+'\n');
console.log('Generated scripts/blog-source-cleanup.sql (data-only).');
