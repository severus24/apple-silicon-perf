#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.resolve(process.argv[2] || path.join(ROOT, 'data/new/geekbench.txt'));
const CANONICAL = path.join(ROOT, 'data/data/geekbench.txt');
const INDEX = path.join(ROOT, 'index.html');
const MODES = ['single', 'multi', 'opencl', 'metal'];
const SOURCE_HEADERS = {
  'Single Core': 'single',
  'Multi-Core': 'multi',
  OpenCL: 'opencl',
  Metal: 'metal'
};
const CANONICAL_HEADERS = {
  single: '单核分数：',
  multi: '多核分数：',
  opencl: 'OpenCL',
  metal: 'Metal：'
};

function parseGeekbench(text) {
  const lines = text.split(/\r?\n/);
  const records = [];
  let mode = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line) continue;
    if (SOURCE_HEADERS[line]) {
      mode = SOURCE_HEADERS[line];
      continue;
    }
    if (!mode) continue;

    let chipIndex = index + 1;
    while (chipIndex < lines.length && !lines[chipIndex].trim()) chipIndex++;
    let scoreIndex = chipIndex + 1;
    while (scoreIndex < lines.length && !lines[scoreIndex].trim()) scoreIndex++;

    const chip = lines[chipIndex]?.trim();
    const scoreText = lines[scoreIndex]?.trim();
    if (!chip || !/^\d[\d,]*$/.test(scoreText || '')) {
      throw new Error(`Invalid Geekbench record near line ${index + 1}`);
    }

    records.push({
      mode,
      device: line,
      chip,
      score: Number(scoreText.replaceAll(',', ''))
    });
    index = scoreIndex;
  }

  if (!records.length) throw new Error('No Geekbench records found');
  return records;
}

function chipInfo(fullName) {
  const apple = fullName.match(/^(Apple (?:M\d+(?: (?:Pro|Max|Ultra))?|A\d+(?: Pro| Max)?))/);
  const intel = fullName.match(/^(Intel\s+(?:Core|Xeon|Pentium|Celeron)\s+[^\s@]+)/i);
  const chip = apple?.[1] || intel?.[1] || fullName.split(' @ ')[0].trim();
  const arch = chip.startsWith('Apple ') ? 'Apple' : 'Intel';
  const pair = fullName.match(/\((\d+)\s+CPU cores(?:,\s*(\d+)\s+GPU cores)?\)/i);
  const plain = pair ? null : fullName.match(/\((\d+)\s+cores?\)/i);
  let short = chip
    .replace(/^Apple\s+/, '')
    .replace(/^Intel\s+(?:Core|Xeon|Pentium|Celeron)\s+/i, '');
  if (pair?.[2]) short += ` (${pair[1]}+${pair[2]})`;
  else if (pair?.[1]) short += ` (${pair[1]})`;
  else if (plain?.[1]) short += ` (${plain[1]})`;
  return { chip, arch, label: short };
}

function aggregate(records) {
  const byChip = new Map();
  records.forEach((record) => {
    const info = chipInfo(record.chip);
    let row = byChip.get(info.chip);
    if (!row) {
      row = {
        chip: info.chip,
        arch: info.arch,
        devices: [],
        configs: new Map()
      };
      byChip.set(info.chip, row);
    }
    if (!row.devices.includes(record.device)) row.devices.push(record.device);
    let config = row.configs.get(info.label);
    if (!config) {
      config = { label: info.label };
      row.configs.set(info.label, config);
    }
    config[record.mode] = Math.max(config[record.mode] || 0, record.score);
  });

  return new Map([...byChip].map(([chip, row]) => {
    const configs = [...row.configs.values()].sort((a, b) =>
      (b.single || 0) - (a.single || 0)
      || (b.multi || 0) - (a.multi || 0)
      || (b.opencl || 0) - (a.opencl || 0)
      || (b.metal || 0) - (a.metal || 0)
    );
    const geek = {};
    MODES.forEach((mode) => {
      const top = configs
        .filter((config) => config[mode] != null)
        .sort((a, b) => b[mode] - a[mode])[0];
      if (top) geek[mode] = { label: top.label, score: top[mode] };
    });
    return [chip, {
      arch: row.arch,
      devices: row.devices,
      geek,
      configs,
      labels: configs.map((config) => config.label)
    }];
  }));
}

function extractRows(html) {
  const start = 'const ROWS = ';
  const end = ';\nconst META =';
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error('Cannot locate embedded ROWS data');
  return JSON.parse(html.slice(startIndex + start.length, endIndex));
}

function emptyRow(chip, arch) {
  return {
    key: chip,
    chip,
    arch,
    devices: [],
    geek: {},
    ai: {},
    mlx: null,
    mlxList: [],
    blender: { cpu: null, gpu: null, gpuList: [] },
    configs: [],
    labels: []
  };
}

function canonicalText(text) {
  const canonicalModes = new Map(Object.entries(SOURCE_HEADERS).map(([header, mode]) => [header, CANONICAL_HEADERS[mode]]));
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      return canonicalModes.get(trimmed) || trimmed;
    })
    .join('\n');
}

const records = parseGeekbench(fs.readFileSync(INPUT, 'utf8'));
const updates = aggregate(records);
const html = fs.readFileSync(INDEX, 'utf8');
const rows = extractRows(html);
const rowsByChip = new Map(rows.map((row) => [row.chip, row]));
let added = 0;
let updated = 0;

updates.forEach((update, chip) => {
  let row = rowsByChip.get(chip);
  if (!row) {
    row = emptyRow(chip, update.arch);
    rows.push(row);
    rowsByChip.set(chip, row);
    added++;
  } else {
    updated++;
  }
  row.arch = update.arch;
  row.devices = update.devices;
  row.geek = update.geek;
  row.configs = update.configs;
  row.labels = update.labels;
});

const start = 'const ROWS = ';
const end = ';\nconst META =';
const startIndex = html.indexOf(start);
const endIndex = html.indexOf(end, startIndex + start.length);
const outputHtml = html.slice(0, startIndex + start.length) + JSON.stringify(rows) + html.slice(endIndex);

fs.writeFileSync(CANONICAL, canonicalText(fs.readFileSync(INPUT, 'utf8')));
fs.writeFileSync(INDEX, outputHtml);

console.log(JSON.stringify({
  input: path.relative(ROOT, INPUT),
  records: records.length,
  appleRecords: records.filter((record) => record.chip.startsWith('Apple ')).length,
  chips: updates.size,
  added,
  updated,
  modes: Object.fromEntries(MODES.map((mode) => [mode, records.filter((record) => record.mode === mode).length]))
}, null, 2));
