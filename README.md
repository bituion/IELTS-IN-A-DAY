# 雅思单词中文释义选择题（纯前端）

词表来自同目录下的 `all_words.txt`。应用会将单词乱序，并对每个单词做“中文释义四选一”。

## 自动初始化
- **释义库已生成**：我已根据词表为你预先生成了 `meanings.csv`。
- **自动加载**：点击页面上的“从 all_words.txt 加载”按钮时，应用会**自动尝试读取并合并** `./meanings.csv` 中的释义。

## 运行方式（推荐二选一）

### 方式 A：Python 本地服务器（已为你启动）
在当前目录运行：
- `python -m http.server 8000`

然后访问：`http://localhost:8000/`

### 方式 B：VS Code Live Server
1. 安装扩展 **Live Server**
2. 右键 `index.html` → **Open with Live Server**

## 部署到 GitHub Pages

本项目是纯静态前端，可以直接部署到 GitHub Pages。

### 方式 A：使用 GitHub Actions 自动部署（已适配）

仓库已包含工作流：`.github/workflows/pages.yml`。

1. 把这些文件提交并推送到你的仓库 `main` 分支：
	- `index.html`
	- `styles.css`
	- `app.js`
	- `all_words.txt`
	- `meanings.csv`
	- （可选）`.nojekyll`
2. 到 GitHub 仓库 → **Settings** → **Pages**：
	- Source 选择 **GitHub Actions**
3. 等待 Actions 跑完后，Pages 会给出访问地址。

### 方式 B：直接用分支发布（不推荐但也可用）

GitHub 仓库 → **Settings** → **Pages** → Source 选择 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`。

## 进阶功能
- **导出与备份**：建议定期点击“导出释义库”保存你的学习成果（CSV 格式）。
- **自动化生成工具**：如果你想使用翻译 API 重新生成释义，可以运行 `python generate_meanings.py`（需安装 `deep-translator`）。

## 数据保存位置
- 优先加载：`./meanings.csv` 文件（自动尝试）
- 合并后的释义库：浏览器 localStorage（键：`ielts_meanings_v1`）
- 本次测验进度：浏览器 localStorage（键：`ielts_session_v1`）

