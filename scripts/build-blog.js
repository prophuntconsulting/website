/**
 * Build script: reads blog/posts/*.md → writes blog/posts.json
 * Runs on every Vercel deploy via package.json "build" script.
 */

const fs   = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'blog', 'posts');
const OUT_FILE  = path.join(__dirname, '..', 'blog', 'posts.json');

function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: content };

    const meta = {};
    match[1].split('\n').forEach(line => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) {
            meta[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
        }
    });
    return { meta, body: match[2] };
}

function estimateReadTime(text) {
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify([], null, 2));
    console.log('No posts directory found — created empty posts.json');
    process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse(); // newest first (alphabetically descending slug)

const posts = files.map(filename => {
    const slug    = filename.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    const { meta, body } = parseFrontmatter(content);

    return {
        slug,
        title:    meta.title    || slug,
        date:     meta.date     || '',
        author:   meta.author   || 'PROPHUNT Advisory Team',
        category: meta.category || 'general',
        excerpt:  meta.excerpt  || body.replace(/#{1,6}\s+/g, '').slice(0, 160) + '…',
        cover:    meta.cover    || '',
        readTime: estimateReadTime(body),
    };
});

fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2));
console.log(`Built posts.json — ${posts.length} post(s)`);
