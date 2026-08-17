# Geekbench AI Browser v1 — macOS 数据

## 数据来源
- 页面：https://browser.geekbench.com/ai/v1 （Geekbench AI 1.0 基准，公开浏览器数据库）
- 抓取日期：2026-08-09
- 数据通过分页（100 页，每页 30 条）抓取全量列表，共 **2,999** 条结果。
- 对候选 Mac 结果（机型名/标识符匹配 macOS 设备 + Apple M/A 芯片），逐个抓取结果详情页（https://browser.geekbench.com/ai/v1/{id}）并校验操作系统为 macOS。

## 文件说明

| 文件 | 内容 |
| --- | --- |
| `geekbench_ai_v1_all.json` / `.csv` | 页面全量 2,999 条列表数据（所有平台） |
| `geekbench_ai_v1_mac.json` | **全部 macOS 平台结果（261 条）**，含机型名称映射、芯片、系统、三大精度得分 |
| `geekbench_ai_v1_mac.csv` | 同上，CSV 版（不含嵌套 workload） |
| `geekbench_ai_v1_mac_full.json` | macOS 全量 + 每个 AI workload 明细（accuracy / score） |
| `geekbench_ai_v1_mac_apple_silicon.json` / `.csv` | 仅 Apple Silicon（M 系列及 A 系列）224 条 |
| `geekbench_ai_v1_mac_intel.json` / `.csv` | 仅 Intel 平台 34 条 |
| `geekbench_ai_v1_mac_hackintosh.csv` | AMD（非 Apple Silicon/Intel，macOS 但非官方硬件）3 条 |
| `geekbench_ai_v1_mac_workloads.csv` | workload 明细（长表：id x workload 行） |
| `apple_mac_identifiers_mapping.json` | 机型标识符 → 官方型号映射表（含中文/英文） |
| `apple_identifiers_macbookpro.json` | 原始 MacBook Pro 标识符映射（来自 https://support.apple.com/zh-cn/108052） |

## 关键字段（mac 系列文件）
- `model_id_original`：Geekbench 详情页的 Model / Model ID（如 `Mac17,8`）
- `model_name` / `model_name_en`：**转换后的官方机型名称**（中/英）
- `arch`：架构分类（`Apple Silicon` / `Intel` / `AMD/Other (Hackintosh)`）
- `framework` / `backend` / `ai_device`：AI 框架（Core ML 等）、后端（CPU/GPU/Neural Engine）、芯片
- `single_precision_score` / `half_precision_score` / `quantized_score`：三大精度得分
- `os` / `platform_info`：macOS 版本及 Geekbench AI 版本信息

## 机型标识符 → 中文型号（示例）
- `Mac17,8` → **MacBook Pro（16 英寸，M5 Pro 或 M5 Max）**
- `Mac17,6` → MacBook Pro（16 英寸，M5 Pro 或 M5 Max）
- `Mac17,7` / `Mac17,9` → MacBook Pro（14 英寸，M5 Pro 或 M5 Max）
- `Mac17,2` → MacBook Pro（14 英寸，M5）
- `Mac17,3` / `Mac17,4` → MacBook Air（13/15 英寸，M5，2026 年）
- `Mac17,5` → MacBook Neo（A18 Pro，2026 年）
- `MacPro7,1` → Mac Pro（2019 年）
- `iMacPro1,1` → iMac Pro（2017 年）
- `iMac20,1` / `iMac20,2` → iMac（27 英寸，2020 年）

完整映射见 `apple_mac_identifiers_mapping.json`。

## 统计
- 全部结果：2,999
- Mac 平台（macOS）：**261**
  - Apple Silicon：224
  - Intel：34
  - AMD/其他（Hackintosh）：3