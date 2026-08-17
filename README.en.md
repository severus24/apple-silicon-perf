# Apple Silicon Performance Rankings

Interactive Mac chip performance comparison page built from public benchmark data.

The page covers four benchmark families:

- Geekbench 6
- Blender Open Data
- Geekbench AI
- MLX

Apple Silicon and supported Intel/AMD Mac configurations are shown in one page, with primary and secondary metric controls.

## Live Demo

<https://severus24.github.io/apple-silicon-perf/>

## Run Locally

Open `index.html` directly in a browser. No build tools, package installation, or local server are required.

The HTML file is self-contained: the CSS and JavaScript are inlined, and the only local asset is:

- `logo.jpg`

## Features

- Primary benchmark selector: Geekbench, Blender, Geekbench AI, MLX
- Secondary selectors for each benchmark mode and backend
- Search by chip name or Mac model
- Filter by device family
- Adjustable number of visible rows
- Unified Geekbench ranking without Apple/Intel group separators
- Comparison drawer with per-submetric rank badges
- Expandable details in the comparison cards
- PNG export of the current ranking

## Project Structure

```text
.
├── .github/workflows/pages.yml   # GitHub Pages deployment workflow
├── index.html                    # Main page with inlined CSS and JavaScript
├── logo.jpg                      # Favicon and Apple logo asset
└── data/                         # Raw benchmark source data
    ├── data/
    │   ├── geekbench.txt
    │   ├── Blender Benchmark CPU.json
    │   ├── Blender Benchmark GPU.json
    │   ├── geekbench_ai_v1_mac.json
    │   ├── average_benchmark.md
    │   └── detailed_benchmark.md
    └── ...
```

## Data Sources

The raw data is committed for reproducibility and future updates:

- `data/data/geekbench.txt`
- `data/data/Blender Benchmark CPU.json`
- `data/data/Blender Benchmark GPU.json`
- `data/data/geekbench_ai_v1_mac.json`
- `data/data/average_benchmark.md`
- `data/data/detailed_benchmark.md`

Benchmark values are only comparable within the same benchmark. They should not be converted or compared across different benchmarks.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in `.github/workflows/pages.yml`.

The workflow copies:

- `index.html` to the Pages site root as `index.html`
- `logo.jpg` to the Pages site root as `logo.jpg`
