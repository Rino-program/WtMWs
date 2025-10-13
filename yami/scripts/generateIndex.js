const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const INDEX_FILE = path.join(ROOT, 'index.html');

// Minimal YAML front-matter extractor
function extractFrontMatter(content){
	if(content.startsWith('---')){
		const idx = content.indexOf('\n---',3);
		if(idx!==-1){
			const fm = content.slice(3, idx+1).trim();
			const rest = content.slice(idx+4).trimStart();
			const obj = {};
			fm.split(/\r?\n/).forEach(line=>{
				const m = line.match(/^([^:]+):\s*(.*)$/);
				if(m){ obj[m[1].trim()] = m[2].trim().replace(/^"|"$/g,''); }
			});
			return {fm: obj, content: rest};
		}
	}
	return {fm:null, content};
}

// Very small markdown -> html renderer (images, headings, links, paragraphs, bold/italic)
function mdToHtml(md){
	// escape
	let s = md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	// images: ![alt](url)
	s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m,alt,src)=>`<img src="${src}" alt="${alt}" style="max-width:100%;height:auto"/>`);
	// links: [text](url)
	s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m,t,u)=>`<a href="${u}">${t}</a>`);
	// headings
	s = s.replace(/^###\s*(.+)$/gim, '<h3>$1</h3>');
	s = s.replace(/^##\s*(.+)$/gim, '<h2>$1</h2>');
	s = s.replace(/^#\s*(.+)$/gim, '<h1>$1</h1>');
	// bold/italic
	s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	// paragraphs: split by blank line
	const parts = s.split(/(?:\r?\n){2,}/).map(p=>p.trim()).filter(Boolean).map(p=>{
		// if already a block element, keep
		if(/^<(h[1-6]|ul|ol|li|pre|img|blockquote|p|div)/i.test(p)) return p;
		// replace single newlines with <br>
		const inline = p.replace(/\r?\n/g,'<br>');
		return `<p>${inline}</p>`;
	});
	return parts.join('\n');
}

function parsePost(filePath){
	const raw = fs.readFileSync(filePath, 'utf8').trim();
	const base = path.basename(filePath);
	const ext = path.extname(base).slice(1).toLowerCase();
	const name = base.replace(/\.[^.]+$/,'');
	const {fm, content} = extractFrontMatter(raw);

	// title: front-matter title -> filename (without date prefix and special token)
	let title = '';
	if(fm && fm.title) title = fm.title;
	else {
		// filename as title by default
		// strip leading date like 2025-10-12-
		title = name.replace(/^\d{4}-\d{2}-\d{2}-?/, '');
		// remove [notitle] token if present when creating title placeholder
		title = title.replace(/\[notitle\]/i,'').trim();
	}

	// detect notitle token in filename
	const noTitle = /\[notitle\]/i.test(name);

	// date: front-matter date -> first line matching YYYY-MM-DD -> undefined
	let date = fm && fm.date ? fm.date : undefined;
	if(!date){
		const m = content.match(/^(\d{4}-\d{2}-\d{2})/m);
		if(m) date = m[1];
	}

	// excerpt: first non-empty line (skip possible date line)
	const lines = content.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
	let excerpt = '';
	for(const l of lines){ if(!/^\d{4}-\d{2}-\d{2}$/.test(l)){ excerpt = l; break; } }
	excerpt = excerpt || lines[0] || '';

	// output HTML filename: posts/<name>.html
	const htmlFile = path.join(POSTS_DIR, `${name}.html`);

	return {srcFile: path.relative(ROOT, filePath).replace(/\\/g,'/'), name, title, date, ext, excerpt, content, htmlFile, noTitle};
}

function generatePostPage(post){
	// Render content (md -> html for md files), txt files will be wrapped in <pre>
	let bodyHtml = '';
	if(post.ext === 'md'){
		bodyHtml = mdToHtml(post.content);
	} else {
		// plain text -> paragraphs
		bodyHtml = '<pre style="white-space:pre-wrap;">' + escapeHtml(post.content) + '</pre>';
	}

	// optionally include date if present
	const dateLine = post.date ? `<div class="meta">${escapeHtml(post.date)}</div>` : '';
	const titleHtml = post.noTitle ? '' : `<h1 class="post-title">${escapeHtml(post.title)}</h1>`;

	const html = `<!doctype html>
<html lang="ja">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<title>${escapeHtml(post.title || post.name)}</title>
	<style>
		body{background:#060607;color:#ddd;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;line-height:1.6;padding:28px}
		.container{max-width:760px;margin:0 auto}
		a{color:#9fb3ff}
		.post-title{color:#fff;margin-bottom:6px}
		.meta{color:#9b9b9b;margin-bottom:14px}
		img{max-width:100%;height:auto}
		pre{background:#0b0b0c;padding:12px;border-radius:6px;color:#ddd}
	</style>
</head>
<body>
	<div class="container">
		${titleHtml}
		${dateLine}
		<div class="content">
			${bodyHtml}
		</div>
		<p><a href="/">← 一覧に戻る</a></p>
	</div>
</body>
</html>`;

	fs.writeFileSync(post.htmlFile, html, 'utf8');
}

function generate(){
	const files = fs.readdirSync(POSTS_DIR)
		.filter(f=>/\.(md|txt)$/i.test(f))
		.filter(f=>!/readme\.md/i.test(f))
		.sort()
		.reverse();

	const posts = files.map(f=>parsePost(path.join(POSTS_DIR,f)));

	// generate per-post pages
	posts.forEach(p=>{
		try{ generatePostPage(p); }catch(e){ console.error('Error generating post page for', p.srcFile, e); }
	});

	const cards = posts.map(p=>{
		const href = path.relative(ROOT, p.htmlFile).replace(/\\/g,'/');
		const titleArea = p.noTitle ? '' : `<div class="title">${escapeHtml(p.title)}</div>`;
		const meta = p.date ? p.date : p.ext;
		return `        <div class="card">\n          <a class="post-link" href="${href}">\n            ${titleArea}\n            <div class="meta">${escapeHtml(meta.toString())}</div>\n            <div class="excerpt" style="color:var(--muted)">${escapeHtml(p.excerpt)}</div>\n          </a>\n        </div>`;
	}).join('\n\n');

	let index = fs.readFileSync(INDEX_FILE,'utf8');
	const start = '<!-- GENERATED_POSTS -->';
	const end = '<!-- /GENERATED_POSTS -->';
	const before = index.split(start)[0];
	const after = index.split(end).slice(1).join(end);
	const newSection = `${start}\n      <div class="grid">\n${cards}\n      </div>\n      ${end}`;
	const out = before + newSection + after;
	fs.writeFileSync(INDEX_FILE,out,'utf8');
	console.log(`Generated ${posts.length} posts and ${posts.length} pages`);
}

function escapeHtml(s){
	return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

if(require.main===module){
	try{ generate(); }catch(e){ console.error(e); process.exit(1); }
}

module.exports = { generate };
