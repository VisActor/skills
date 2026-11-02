import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = path.join(root, 'skills/chart-assistant');
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'docs/upstreams/chart-assistant.json'), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const comparePaths = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));

function filesUnder(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    assert.equal(entry.isSymbolicLink(), false, `Unexpected symlink: ${relative}`);
    if (entry.isDirectory()) return filesUnder(path.join(directory, entry.name), `${relative}/`);
    assert.equal(entry.isFile(), true, `Expected regular file: ${relative}`);
    return [relative];
  }).sort(comparePaths);
}

function installedCopy(t) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'chart-assistant-install-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const installed = path.join(temporary, 'standalone skill');
  fs.cpSync(source, installed, { recursive: true });
  return { temporary, installed };
}

function childNode(cwd, args) {
  const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', PATH: '' };
  return spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 10000 });
}

test('distribution matches the upstream file inventory and release fingerprint', () => {
  assert.equal(provenance.schema_version, 1);
  assert.equal(provenance.source.repository, 'dp/vchart-editor');
  assert.equal(provenance.source.path, 'packages/chart-assistant');
  assert.match(provenance.source.commit, /^[a-f0-9]{40}$/);
  assert.equal(provenance.distribution.repository, 'VisActor/skills');
  assert.equal(provenance.distribution.path, 'skills/chart-assistant');
  assert.equal(provenance.fingerprint_algorithm, 'visactor-skill-content-v1');
  const files = filesUnder(source).map(relative => {
    const full = path.join(source, relative);
    const bytes = fs.readFileSync(full);
    return {
      path: relative,
      mode: fs.statSync(full).mode & 0o111 ? '100755' : '100644',
      size: bytes.length,
      sha256: sha256(bytes)
    };
  });
  assert.deepEqual(files, provenance.files);
  const records = 'visactor-skill-content-v1\n' + files.map(file => `${file.mode}\t${file.sha256}\t${file.path}\n`).join('');
  assert.equal(sha256(records), provenance.content_sha256);
});

test('copied Skill keeps all Markdown references within its independent directory', t => {
  const { installed } = installedCopy(t);
  let localLinks = 0;
  for (const relative of filesUnder(installed).filter(file => file.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(installed, relative), 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split(/\s+["']/)[0].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(path.join(installed, relative)), decodeURIComponent(target));
      assert.ok(resolved.startsWith(installed + path.sep), `${relative}: link escapes installed Skill: ${target}`);
      assert.ok(fs.existsSync(resolved), `${relative}: missing installed reference: ${target}`);
      localLinks++;
    }
  }
  assert.ok(localLinks > 0, 'Expected actual local documentation links');
});

test('copied Skill imports runtime modules and validates shipped examples without the source checkout', t => {
  const { installed, temporary } = installedCopy(t);
  const program = `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import path from 'node:path';
    import { pathToFileURL } from 'node:url';
    const installed = ${JSON.stringify(installed)};
    const validation = await import(pathToFileURL(path.join(installed, 'scripts/common-option-validation.mjs')));
    for (const name of ['business-protocol-validation', 'export-image', 'insert-image', 'deliver-image']) {
      await import(pathToFileURL(path.join(installed, 'scripts', name + '.mjs')));
    }
    let checked = 0;
    function visit(value, at) {
      if (!value || typeof value !== 'object') return;
      if (value.commonOption) {
        assert.deepEqual(validation.validateCommonOption(value.commonOption), [], at);
        checked++;
      }
      for (const [key, child] of Object.entries(value)) visit(child, at + '.' + key);
    }
    function walk(directory) {
      for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.json')) visit(JSON.parse(fs.readFileSync(full, 'utf8')), entry.name);
      }
    }
    walk(path.join(installed, 'examples'));
    assert.ok(checked > 0);
    assert.ok(validation.validateCommonOption({elements:[{type:'unsupported'}]}).length > 0);
    console.log(JSON.stringify({checked}));
  `;
  const result = childNode(temporary, ['--input-type=module', '--eval', program]);
  assert.equal(result.status, 0, result.stderr || String(result.error));
  assert.ok(JSON.parse(result.stdout).checked > 0);
});

test('copied image CLIs reject missing arguments before invoking any host tool', t => {
  const { installed, temporary } = installedCopy(t);
  for (const name of ['export-image', 'insert-image', 'deliver-image']) {
    const result = childNode(temporary, [path.join(installed, 'scripts', `${name}.mjs`)]);
    assert.equal(result.status, 1, `${name}: ${result.stderr || result.error}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /必须提供|必须指定/);
  }
  assert.deepEqual(fs.readdirSync(temporary), ['standalone skill']);
});

test('copied delivery modules preserve HTTPS defaults, saved data and explicit positions offline', async t => {
  const { installed } = installedCopy(t);
  const moduleUrl = name => pathToFileURL(path.join(installed, 'scripts', `${name}.mjs`));
  const { DEFAULT_ENDPOINT, buildRequest } = await import(moduleUrl('export-image'));
  const { parseInsertArgs } = await import(moduleUrl('insert-image'));
  const { deliverImage, parseDeliveryArgs } = await import(moduleUrl('deliver-image'));
  const endpoint = new URL(DEFAULT_ENDPOINT);
  assert.equal(endpoint.protocol, 'https:');
  assert.equal(endpoint.hostname, 'charteasy.visactor.com');
  assert.equal(endpoint.pathname, '/api/v1/chart_assistant/export_image');
  assert.equal(endpoint.search, '');
  assert.equal(endpoint.username, '');
  assert.equal(endpoint.password, '');
  const saved = [{ id: 'saved-current-state' }];
  const request = buildRequest({ browserData: saved, commonOption: { elements: [] } });
  assert.equal(request.input.type, 'editorData');
  assert.deepEqual(request.input.editorData, saved);
  assert.deepEqual(request.output, { format: 'png', dpr: 2, background: 'transparent' });

  const insert = parseInsertArgs(['--image', 'image.png', '--doc', 'doc123', '--width', '820', '--selection', 'A paragraph', '--before']);
  assert.equal(insert.selection, 'A paragraph');
  assert.equal(insert.before, true);
  assert.equal(insert.width, 820);
  assert.equal(insert.as, 'user');
  const parsed = parseDeliveryArgs(['--input', 'chart.json', '--output', 'chart.png', '--doc', 'doc123', '--selection', 'A paragraph', '--before']);
  const calls = [];
  const image = { path: path.join(installed, 'synthetic.png'), width: 1600, height: 900 };
  const deps = {
    exportImage: async options => { calls.push(['export', options]); return image; },
    insertImage: async options => { calls.push(['insert', options]); return { verified: true }; }
  };
  const delivered = await deliverImage(parsed, deps);
  assert.equal(delivered.document.verified, true);
  assert.equal(calls[0][1].autoLayoutWidth, 794);
  assert.equal(calls[1][1].width, 820);
  assert.equal(calls[1][1].selection, 'A paragraph');
  assert.equal(calls[1][1].before, true);
  assert.equal(calls[1][1].as, 'user');

  let exports = 0;
  await assert.rejects(deliverImage(parsed, {
    exportImage: async () => { exports++; return image; },
    insertImage: async () => { throw new Error('synthetic host failure'); }
  }), error => error.message.includes(image.path) && /原回执/.test(error.message));
  assert.equal(exports, 1, 'A failed insertion must not silently render or write again');
  assert.equal(fs.existsSync(image.path), false, 'Injected functions perform no real image or document writes');
});
