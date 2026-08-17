# Apple Silicon 性能排行

[English](README.en.md)

基于公开基准数据整理的 Mac 芯片综合性能对比页面。

页面覆盖四类基准：

- Geekbench 6
- Blender Open Data
- Geekbench AI
- MLX

Apple Silicon 以及支持的 Intel/AMD Mac 配置会显示在同一个页面中，并支持主选项与二级选项切换。

## 在线访问

<https://severus24.github.io/apple-silicon-perf/>

## 本地运行

直接用浏览器打开根目录的 `index.html` 即可，不需要构建工具、依赖安装或本地服务器。

HTML 文件是自包含的，CSS 和 JavaScript 都已内嵌，唯一的本地资源是：

- `logo.jpg`

## 功能

- 主选项：Geekbench、Blender、Geekbench AI、MLX
- 各基准对应的二级选项
- 按芯片名称或 Mac 机型搜索
- 按设备家族筛选
- 可调整显示行数
- Geekbench 统一排行，不再拆分 Apple / Intel 分组
- 对比抽屉支持每个子项目的排名徽标
- 对比卡片中的详情分类展示
- 当前排行可导出为 PNG 图片

## 项目结构

```text
.
├── .github/workflows/pages.yml   # GitHub Pages 部署工作流
├── index.html                    # 主页面，内嵌 CSS 和 JavaScript
├── logo.jpg                      # favicon 和 Apple logo 资源
└── data/                         # 原始基准数据
    ├── data/
    │   ├── geekbench.txt
    │   ├── Blender Benchmark CPU.json
    │   ├── Blender Benchmark GPU.json
    │   ├── geekbench_ai_v1_mac.json
    │   ├── average_benchmark.md
    │   └── detailed_benchmark.md
    └── ...
```

## 数据来源

原始数据已提交，便于复现和后续更新：

- `data/data/geekbench.txt`
- `data/data/Blender Benchmark CPU.json`
- `data/data/Blender Benchmark GPU.json`
- `data/data/geekbench_ai_v1_mac.json`
- `data/data/average_benchmark.md`
- `data/data/detailed_benchmark.md`

不同基准的数值只应在同一个基准内部比较，不应跨基准换算或直接比较。

## 部署

推送到 `main` 会触发 `.github/workflows/pages.yml` 中的 GitHub Actions 工作流。

工作流会将：

- `index.html` 复制为 Pages 站点根目录的 `index.html`
- `logo.jpg` 复制为 Pages 站点根目录的 `logo.jpg`
