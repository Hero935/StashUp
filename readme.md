# StashUp 專案

## 專案描述
StashUp 是一個基於 Python Flask 的輕量級 Web 應用程式，旨在提供一個簡單且直觀的介面，用於高效地管理和儲存各種資料。它支援資料的快速存儲、檢索與組織，適用於個人筆記、小型專案資料管理或任何需要輕量級資料儲存解決方案的場景。

## 檔案結構
```
.
├── .env                  # 環境變數設定檔 (例如資料庫路徑、密鑰)
├── .gitignore            # Git 忽略檔案設定 (定義不應納入版本控制的檔案和目錄)
├── main.py               # Flask 應用程式主程式 (包含路由、資料庫操作和核心業務邏輯)
├── readme.md             # 專案說明文件 (提供專案概述、設定和使用指南)
├── requirements.txt      # Python 依賴套件清單 (列出所有必要的 Python 函式庫及其版本)
├── run.bat               # Windows 批次檔 (用於快速啟動 Flask 應用程式)
├── stashup.db            # SQLite 資料庫檔案 (應用程式所有資料的持久化儲存)
└── static/               # 靜態檔案目錄 (包含前端資源)
    ├── index.html        # 前端主頁面 (應用程式的單頁面應用程式 (SPA) 入口點)
    ├── script.js         # 前端 JavaScript 邏輯 (處理使用者互動和 API 請求)
    └── style.css         # 前端樣式表 (定義應用程式使用者介面的視覺風格)
```

## 使用技術
- **後端框架:** Python 3.x, Flask (輕量級 Web 框架)
- **前端技術:** HTML5, CSS3, JavaScript (實現響應式使用者介面)
- **資料庫:** SQLite (輕量級嵌入式資料庫，無需獨立伺服器)

## 檔案清單與簡短說明
- [`_env`](.env): 應用程式的環境變數配置，例如資料庫連接字串、應用程式密鑰等敏感資訊。
- [`_gitignore`](.gitignore): Git 版本控制忽略清單，確保不必要的檔案（如編譯產物、虛擬環境、日誌）不會被提交到儲存庫。
- [`main.py`](main.py): StashUp 應用程式的核心入口點。負責定義 Flask 路由、處理 HTTP 請求、執行資料庫操作以及實現主要的業務邏輯。
- [`readme.md`](readme.md): 本專案的詳細說明文件。包含專案的整體介紹、環境設定、檔案結構、技術棧、以及安裝與執行步驟。
- [`requirements.txt`](requirements.txt): Python 專案的依賴管理檔案。列出了所有運行 StashUp 所需的 Python 套件及其精確版本，便於環境的快速重建與部署。
- [`run.bat`](run.bat): 專為 Windows 環境設計的批次檔。提供一個便捷的方式來啟動 Flask 開發伺服器，簡化了應用程式的啟動流程。
- [`stashup.db`](stashup.db): 應用程式使用的 SQLite 資料庫檔案。所有 StashUp 應用程式的資料（如用戶數據、儲存的內容）都將持久化儲存在此檔案中。
- [`static/`](static/): 存放所有前端靜態資源的目錄。
    - [`index.html`](static/index.html): StashUp 應用程式的單頁面應用程式 (SPA) 入口點。負責載入所有前端資源並初始化使用者介面。
    - [`script.js`](static/script.js): 包含前端的 JavaScript 邏輯。處理使用者介面互動、非同步 API 請求、資料處理和動態內容更新。
    - [`style.css`](static/style.css): 定義 StashUp 應用程式使用者介面的樣式。負責控制頁面的佈局、顏色、字體和響應式設計。

## 安裝及執行方式

### 1. 安裝 Python 依賴套件
請確保您的系統已安裝 Python 3.6 或更高版本。打開終端機（推薦使用 PowerShell），導航到專案的根目錄，然後執行以下命令來安裝所有必要的 Python 套件：

```powershell
pip install -r requirements.txt
```

### 2. 啟動應用程式
在專案根目錄下，您可以選擇以下兩種方式啟動 StashUp 應用程式：

#### 方式一：使用 `run.bat` (推薦用於 Windows)
直接執行提供的批次檔：

```powershell
.\run.bat
```

#### 方式二：手動執行 Flask 應用程式
如果您偏好手動控制，或在非 Windows 環境下，可以執行以下命令：

```powershell
python main.py
```

應用程式成功啟動後，您將在終端機中看到類似 `Running on http://127.0.0.1:5000` 的訊息。打開您的網頁瀏覽器，訪問 `http://127.0.0.1:5000` (或終端機中顯示的任何其他位址) 即可開始使用 StashUp。