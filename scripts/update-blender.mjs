#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CPU_INPUT = path.resolve(process.argv[2] || path.join(ROOT, 'data/new/Blender Benchmark_CPU.json'));
const GPU_INPUT = path.resolve(process.argv[3] || path.join(ROOT, 'data/new/Blender Benchmark_GPU.json'));
const CPU_CANONICAL = path.join(ROOT, 'data/data/Blender Benchmark CPU.json');
const GPU_CANONICAL = path.join(ROOT, 'data/data/Blender Benchmark GPU.json');
const INDEX = path.join(ROOT, 'index.html');
const OUTPUT_HEADER = ['Device Name', 'Median Score', 'Number of Benchmarks'];

function columnIndex(header, names) {
  const index = header.findIndex((value) => names.includes(String(value).trim()));
  if (index < 0) throw new Error(`Missing column: ${names.join(' / ')}`);
  return index;
}

function readDataset(filePath, label) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(data.header) || !Array.isArray(data.body)) {
    throw new Error(`${label} data must contain header and body arrays`);
  }
  return data;
}

function normalizeCpu(data) {
  const nameIndex = columnIndex(data.header, ['Device Name', '设备名称']);
  const scoreIndex = columnIndex(data.header, ['Median Score', '中位数得分']);
  const countIndex = columnIndex(data.header, ['Number of Benchmarks', '基准测试数量']);
  const computeIndex = data.header.findIndex((value) => ['Compute Type', '计算类型'].includes(String(value).trim()));
  const versionIndex = data.header.findIndex((value) => ['Blender Version', 'Blender 版本'].includes(String(value).trim()));
  const byChip = new Map();
  const versions = new Set();

  data.body.forEach((row) => {
    const name = String(row[nameIndex] || '').trim();
    const score = Number(row[scoreIndex]);
    const count = Number(row[countIndex]);
    const computeType = computeIndex >= 0 ? String(row[computeIndex] || '').trim().toUpperCase() : 'CPU';
    if (!name || computeType !== 'CPU' || !Number.isFinite(score) || !Number.isFinite(count)) return;
    if (versionIndex >= 0 && row[versionIndex]) versions.add(String(row[versionIndex]).trim());
    const current = byChip.get(name);
    if (!current || score > current.score) byChip.set(name, { name, score, count });
  });

  return {
    body: [...byChip.values()]
      .sort((a, b) => b.score - a.score)
      .map(({ name, score, count }) => [name, score, count]),
    version: [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0] || null
  };
}

function normalizeGpu(data) {
  const nameIndex = columnIndex(data.header, ['Device Name', '设备名称']);
  const scoreIndex = columnIndex(data.header, ['Median Score', '中位数得分']);
  const countIndex = columnIndex(data.header, ['Number of Benchmarks', '基准测试数量']);
  const byName = new Map();

  data.body.forEach((row) => {
    const name = String(row[nameIndex] || '').trim();
    const score = Number(row[scoreIndex]);
    const count = Number(row[countIndex]);
    if (!name || !Number.isFinite(score) || !Number.isFinite(count)) return;
    const current = byName.get(name);
    if (!current || score > current.score) byName.set(name, { name, score, count });
  });

  return [...byName.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ name, score, count }) => [name, score, count]);
}

function extractRows(html) {
  const start = 'const ROWS = ';
  const end = ';\nconst META =';
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error('Cannot locate embedded ROWS data');
  return JSON.parse(html.slice(startIndex + start.length, endIndex));
}

function emptyRow(chip) {
  return {
    key: chip,
    chip,
    arch: 'Apple',
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

function writeCanonical(filePath, body) {
  fs.writeFileSync(filePath, JSON.stringify({
    header: OUTPUT_HEADER,
    footer: null,
    body
  }, null, 4) + '\n');
}

const cpu = normalizeCpu(readDataset(CPU_INPUT, 'Blender CPU'));
const gpu = normalizeGpu(readDataset(GPU_INPUT, 'Blender GPU'));
if (!cpu.body.length) throw new Error('No Blender CPU records found');
if (!gpu.length) throw new Error('No Blender GPU records found');

const html = fs.readFileSync(INDEX, 'utf8');
const rows = extractRows(html);
const rowsByChip = new Map(rows.map((row) => [row.chip, row]));
let added = 0;

function ensureRow(chip) {
  let row = rowsByChip.get(chip);
  if (!row) {
    row = emptyRow(chip);
    rows.push(row);
    rowsByChip.set(chip, row);
    added++;
  }
  return row;
}

rows.forEach((row) => {
  row.blender = { cpu: null, gpu: null, gpuList: [] };
});

cpu.body.forEach(([chip, score, count]) => {
  ensureRow(chip).blender.cpu = { score, count };
});

gpu.forEach(([name, score, count]) => {
  const match = name.match(/^(.+?)\s*\(GPU\s*-\s*([^)]+)\)\s*$/i);
  const chip = match ? match[1].trim() : name;
  const detail = match ? `GPU · GPU - ${match[2]}` : `GPU · ${name}`;
  ensureRow(chip).blender.gpuList.push({ detail, score, count });
});

rows.forEach((row) => {
  const list = row.blender.gpuList.sort((a, b) => b.score - a.score);
  row.blender.gpu = list[0] || null;
});

let outputHtml = html;
if (cpu.version) {
  const version = cpu.version.split('.').slice(0, 2).join('.');
  const existingVersions = new Set(
    [...outputHtml.matchAll(/Blender\s+(\d+\.\d+)/g)].map((match) => match[1])
  );
  existingVersions.forEach((oldVersion) => {
    outputHtml = outputHtml.replaceAll(`Blender ${oldVersion}`, `Blender ${version}`);
  });
}

const start = 'const ROWS = ';
const end = ';\nconst META =';
const startIndex = outputHtml.indexOf(start);
const endIndex = outputHtml.indexOf(end, startIndex + start.length);
outputHtml = outputHtml.slice(0, startIndex + start.length) + JSON.stringify(rows) + outputHtml.slice(endIndex);

writeCanonical(CPU_CANONICAL, cpu.body);
writeCanonical(GPU_CANONICAL, gpu);
fs.writeFileSync(INDEX, outputHtml);

console.log(JSON.stringify({
  cpuInput: path.relative(ROOT, CPU_INPUT),
  gpuInput: path.relative(ROOT, GPU_INPUT),
  version: cpu.version,
  cpuRecords: cpu.body.length,
  gpuRecords: gpu.length,
  added,
  cpuChips: cpu.body.length,
  gpuChips: new Set(gpu.map(([name]) => name.replace(/\s*\(GPU\s*-.*$/i, '').trim())).size
}, null, 2));
