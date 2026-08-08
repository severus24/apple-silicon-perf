# Apple Silicon Performance Rankings

Interactive Mac chip performance rankings built on public Geekbench scores, covering Apple Silicon and Intel Macs across single-core, multi-core, OpenCL, and Metal.

[中文版](README.zh-CN.md)

## Features

- Four scoring modes: Single-Core, Multi-Core, OpenCL, Metal
- Search by chip name or device model, e.g. `M4 Pro`
- Filter by device family: MacBook, Mac mini, iMac, Mac Studio, Mac Pro
- Adjust how many entries to show (10 to 75 chip configurations)
- Click a ranking row to add chips to the comparison panel
- Export the current ranking as a PNG image

## Usage

Open `mac-perf.html` directly in a browser. No build tools or local server required.

Data lives in `mac-perf-data.js` and is loaded through `window.MAC_PERF`. Refresh the page after updating data.

## Live Demo

- [mac-perf.html](https://severus24.github.io/apple-silicon-perf/mac-perf.html)

## Files

| File | Description |
| --- | --- |
| `mac-perf.html` | Main page with the full set of interactions |
| `mac-perf-data.js` | Geekbench ranking data, updated 2026-08-08 |
| `mac-perf-v2.html` | Earlier simplified version |
| `mac-debug.html` | Debugging build that logs interactions via `window.__log` |
| `mac-log2.html` | Logging build that records click events via `window.__d` / `window.__dl` |

## Data

Data is collected from public Geekbench scores. This is an unofficial dataset intended for performance comparison only. Scores follow Geekbench's official metrics, and the same chip configuration may appear across multiple models.
