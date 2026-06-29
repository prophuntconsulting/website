const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '..', 'properties', 'posts');
const outFile  = path.join(__dirname, '..', 'properties', 'posts.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: content.trim() };
  const lines = match[1].split('\n');
  const data = {};
  lines.forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (!isNaN(val) && val !== '') val = Number(val);
    data[key] = val;
  });
  return { data, body: content.slice(match[0].length).trim() };
}

const files = fs.readdirSync(postsDir)
  .filter(f => f.endsWith('.md'))
  .sort();

const properties = files.map(file => {
  const slug = file.replace(/\.md$/, '');
  const raw  = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  return { slug, ...data, body: body || '' };
});

fs.writeFileSync(outFile, JSON.stringify(properties, null, 2));
console.log(`Built properties/posts.json — ${properties.length} properties`);
