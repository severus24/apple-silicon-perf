# 测试说明

项目使用 Node.js 内置测试运行器和本机 Chrome 做真实浏览器回归测试。

```sh
node --test tests/compare-rank.test.mjs
```

Chrome 默认使用 macOS 安装路径；其他环境可通过 `CHROME_BIN` 指定浏览器可执行文件。
