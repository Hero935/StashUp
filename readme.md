# StashUp 專案

## 專案描述
StashUp 是一個基於 Python Flask 的 Web 應用程式，用於管理和儲存資料。它提供了一個簡單的介面來處理資料的存儲和檢索。

## 檔案結構
```
.
├── .env                  # 環境變數設定檔
├── .ignore               # Git 忽略檔案設定
├── main.py               # Flask 應用程式主程式
├── readme.md             # 專案說明文件
├── requirements.txt      # Python 依賴套件清單
├── run.bat               # Windows 批次檔，用於啟動應用程式
├── stashup.db            # SQLite 資料庫檔案
└── static/               # 靜態檔案目錄
    ├── index.html        # 前端主頁面
    ├── script.js         # 前端 JavaScript 邏輯
    └── style.css         # 前端樣式表
```

## 使用技術
- **後端:** Python, Flask
- **前端:** HTML5, CSS3, JavaScript
- **資料庫:** SQLite

## 檔案清單與簡短說明
- [`_env`](.env): 包含應用程式的環境變數，例如資料庫連接字串或密鑰。
- [`_ignore`](.ignore): 定義 Git 應忽略的文件和目錄，例如編譯後的檔案、虛擬環境和日誌。
- [`main.py`](main.py): 應用程式的核心邏輯，包含 Flask 路由、資料庫操作和業務邏輯。
- [`readme.md`](readme.md): 本專案的說明文件，提供專案概述、設定和使用指南。
- [`requirements.txt`](requirements.txt): 列出所有 Python 依賴套件及其版本，用於環境重建。
- [`run.bat`](run.bat): 一個簡單的 Windows 批次檔，用於啟動 Flask 應用程式。
- [`stashup.db`](stashup.db): 應用程式使用的 SQLite 資料庫檔案，儲存所有應用程式資料。
- [`static/`](static/): 包含所有前端靜態資源的目錄。
    - [`index.html`](static/index.html): 應用程式的單頁面應用程式 (SPA) 入口點。
    - [`script.js`](static/script.js): 處理前端互動和 API 請求的 JavaScript 程式碼。
    - [`style.css`](static/style.css): 定義應用程式使用者介面的樣式。

## 安裝及執行方式

### 1. 安裝 Python 依賴套件
請確保您的系統已安裝 Python 3。然後，打開終端機並導航到專案根目錄，執行以下命令安裝所需的套件：

```powershell
pip install -r requirements.txt
```

### 2. 啟動應用程式
在專案根目錄下，您可以直接執行 `run.bat` 批次檔來啟動應用程式：

```powershell
.\run.bat
```

或者，您也可以手動執行 Flask 應用程式：

```powershell
python main.py
```

應用程式啟動後，您可以在瀏覽器中訪問 `http://127.0.0.1:5000` (或終端機中顯示的任何其他位址) 來使用 StashUp。