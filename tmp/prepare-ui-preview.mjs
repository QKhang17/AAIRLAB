// Generate isolated visual fixtures; never load the real API client.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
for (const [kind, path] of Object.entries({manual:'User/ManualLabeling/Task.html',ai:'User/AILabeling/Task.html',review:'User/ManualReview/Task.html',analysis:'User/ResultAnalysis/Task.html',manager:'Manager/Statistics.html'})) {
    const source = `/main/HTML/${path}`;
    let html = readFileSync(resolve(root, source.slice(1)), 'utf8');
    html = html.replace(/\b(src|href)="([^"#][^"]*)"/g, (match, attribute, value) => {
        if (/^(https?:|data:|blob:)/.test(value)) return match;
        return `${attribute}="${new URL(value, `http://localhost${source}`).pathname}"`;
    });
    html = html.replace(/<script\b[^>]*src="\/main\/JavaScript\/api.js"[^>]*><\/script>/g,
        '<script src="/tmp/visual-mock.js"></script>');
    const output = resolve(root, 'tmp/ui-preview', path);
    mkdirSync(dirname(output), {recursive:true});
    writeFileSync(output, html);
    process.stdout.write(`${kind}: /tmp/ui-preview/${path}?kind=${kind}\n`);
}
