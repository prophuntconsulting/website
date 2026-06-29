const fs   = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '..', 'properties', 'posts');
const outFile  = path.join(__dirname, '..', 'properties', 'posts.json');

function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const data  = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }
    const key  = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();
    if (rest === '') {
      const items = [];
      i++;
      while (i < lines.length && /^\s+- /.test(lines[i])) {
        items.push(lines[i].trim().slice(2).trim().replace(/^["']|["']$/g, ''));
        i++;
      }
      if (items.length) data[key] = items;
    } else {
      let val = rest.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);
      data[key] = val;
      i++;
    }
  }
  return data;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: content.trim() };
  return { data: parseYaml(match[1]), body: content.slice(match[0].length).trim() };
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort();

const properties = files.map(file => {
  const slug = file.replace(/\.md$/, '');
  const raw  = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const url   = data.url || `/projects/${slug}`;
  const cover = data.cover || data.hero_1 || '';
  return { slug, ...data, cover, url, body: body || '' };
});

fs.writeFileSync(outFile, JSON.stringify(properties, null, 2));
console.log(`Built properties/posts.json — ${properties.length} properties`);

// Generate a static detail page for each property at projects/{slug}/index.html
const templatePath = path.join(__dirname, '..', 'property.html');
if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8');

  properties.forEach(p => {
    const outDir = path.join(__dirname, '..', 'projects', p.slug);
    fs.mkdirSync(outDir, { recursive: true });

    // Inject the slug so it doesn't have to parse it from the URL
    const html = template.replace(
      "const slug = window.location.pathname.split('/').filter(Boolean).pop() || '';",
      `const slug = '${p.slug}';`
    );

    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`  → projects/${p.slug}/index.html`);
  });
}
