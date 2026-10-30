# repo-source-plugins

从远程列表文件**批量导入 / 自动更新 LX Music 自定义源**的 Any Listen 扩展（移植自 [lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 插件 `repo-source-plugins`，架构参照 [any-listen-extension-lx-api-source-loader](https://github.com/any-listen/any-listen-extension-lx-api-source-loader)）。

## 功能

1. **远程列表批量导入**：在设置里填写远程列表文件地址（纯文本，每行一个自定义源 js 的地址，`#` / `//` 开头的行会被忽略），点「立即导入 / 更新」即批量下载并导入到本扩展。
2. **启动自动更新**：开启「自动更新」后，每次启动都会在后台拉取列表并更新已导入的源：
   - 脚本内容未变化（id 为内容 md5）→ 跳过不动，勾选状态原样保留；
   - 内容变化 → 存新脚本、删旧脚本，勾选状态自动切换到新脚本（隔离环境自动重建）；
   - 新地址 → 新增导入（不自动启用，需在设置里手动勾选）；
   - 单条失败不影响其余；列表里去掉的地址不会自动删除，可用「移除全部远程源」整体清理。
3. **musicUrl 资源**：勾选启用后，注册 kw / tx / wy / kg / mg 五个源的 `musicUrl` 资源，由已启用脚本按音质降级匹配取链，经宿主代理返回。

## 设置

| 配置项 | 说明 |
| --- | --- |
| 远程列表文件地址 | 每行一个自定义源 js 地址的纯文本文件 |
| 自动更新 | 启动时后台自动导入 / 更新（默认开启） |
| 自定义源 | 勾选启用的源（可移除条目），支持「立即导入 / 更新」「移除全部远程源」按钮 |

## 与原插件的差异

- 原插件的**搜索结果同源去重**（基于 lx-music-desktop 的 `api.patch` 运行时覆盖能力）**无法移植**：Any Listen 扩展宿主不提供 patch / 拦截 API。
- 原插件导入到客户端全局「自定义源」列表；本扩展将脚本保存在扩展自己的存储里，通过扩展的 `musicUrl` 资源生效。

## 开发

```bash
npm install
npm run build   # 产出 build/repo-source-plugins_v<version>.alix
```

## License

Apache License 2.0（包含自 lx-api-source-loader 的代码遵循其原许可）
