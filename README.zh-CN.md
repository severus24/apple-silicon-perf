# Apple Silicon 性能排行

[English](README.md)

基于 Geekbench 公开成绩的 Mac 芯片性能对比页面，覆盖 Apple Silicon 与部分 Intel Mac，支持单核、多核、OpenCL、Metal 四个维度。

## 功能

- 四种计分模式：单核、多核、OpenCL、Metal
- 按芯片名称或机型搜索，例如 `M4 Pro`
- 按机型家族筛选：MacBook、Mac mini、iMac、Mac Studio、Mac Pro
- 调整排行显示数量（10 到 75 款芯片配置）
- 点击排行行加入对比面板，支持多款芯片横向比较
- 一键将当前排行导出为 PNG 图片

## 使用

直接用浏览器打开 `mac-perf.html` 即可，不需要构建工具或本地服务器。

数据位于 `mac-perf-data.js`，页面通过 `window.MAC_PERF` 读取排行数据。更新数据后刷新页面即可生效。

## 在线访问

- [mac-perf.html](https://severus24.github.io/apple-silicon-perf/mac-perf.html)

## 文件说明

| 文件 | 说明 |
| --- | --- |
| `mac-perf.html` | 主页面，包含完整交互 |
| `mac-perf-data.js` | Geekbench 排行数据，更新时间 2026-08-08 |
| `mac-perf-v2.html` | 早期简化版本 |
| `mac-debug.html` | 调试版本，通过 `window.__log` 记录交互事件 |
| `mac-log2.html` | 日志调试版本，通过 `window.__d` / `window.__dl` 记录点击事件 |

## 数据说明

数据来自 Geekbench 公开成绩，为个人整理的非官方数据，仅用于性能对比参考。各模式采用 Geekbench 官方计分口径，同一芯片配置可能出现在多款机型中。
