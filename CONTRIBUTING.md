# 参与优化与提交代码

可以把 GitHub 仓库交给其他开发者或 AI 编程工具继续优化，但不要让对方直接覆盖
`main` 或当前验收分支。推荐使用“独立分支 + Pull Request”。

## 1. 先确定对方是否有仓库权限

仅发送仓库链接，对方只能查看和下载代码，并不会自动获得上传权限。可以选择：

- **团队成员**：在 GitHub 仓库 `Settings → Collaborators` 中邀请对方。对方接受后，
  可以把自己的分支推到本仓库。
- **外部协作者**：让对方先 Fork 仓库，在自己的 Fork 中修改，然后向本仓库提交
  Pull Request。这样不需要给对方本仓库写入权限。

无论使用哪种方式，都不应让对方直接覆盖当前验收分支。

## 2. 获取当前验收版本

```bash
git clone https://github.com/Kunzyyy/Adventure-x-hackathon.git
cd Adventure-x-hackathon
git checkout Jin-Ziyao
git pull origin Jin-Ziyao
```

当前最新、已经完成真实 AI 线上验收的基线是 `Jin-Ziyao`。

## 3. 创建自己的优化分支

分支名应说明修改内容，例如：

```bash
git switch -c improve/mobile-layout
```

不要在 `Jin-Ziyao`、`main` 或其他成员的个人分支上直接开发。

## 4. 修改前先读

- `team-contract/API-CONTRACT.md`：5 个正式接口的字段约定
- `team-contract/TEAM-RULES.md`：不编造、不歧视等产品红线
- `README.md`：当前功能、运行方式和项目结构

不得提交 `.env`、API Key、密码、Token 或其他凭据。

## 5. 本地验证

安装依赖并运行后端检查：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter backend typecheck
pnpm --filter backend test
pnpm --filter backend build
```

修改页面时，还应在桌面端和手机尺寸下完整走一遍学生端、企业端流程。

## 6. 推送并提交 Pull Request

```bash
git add <本次实际修改的文件>
git commit -m "说明本次优化内容"
git push -u origin improve/mobile-layout
```

然后在 GitHub 创建 Pull Request，目标分支选择项目负责人指定的验收分支。
Pull Request 中至少写清：

- 改了什么
- 为什么要改
- 修改了哪些文件
- 运行了哪些测试
- 页面变化的截图或录屏
- 是否影响 API、环境变量或部署配置

项目成员验收通过后再合并。这样即使优化不合适，也能关闭 Pull Request，不会破坏
当前可用版本。
