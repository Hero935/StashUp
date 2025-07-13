# StashUp - 日常記帳應用程式

StashUp 是一個簡單的日常記帳應用程式，旨在幫助使用者輕鬆追蹤收入和支出。它提供使用者註冊、登入、交易記錄、分類管理、交易匯入/匯出以及財務分析圖表等功能。

## 檔案結構

```
.
├── main.py             # FastAPI 後端應用程式
├── requirements.txt    # Python 依賴套件
├── run.bat             # 啟動應用程式的批次檔 (Windows)
├── todolist.md         # 任務清單
├── wrangler.toml       # Cloudflare Workers 相關配置 (如果使用)
├── static/             # 靜態檔案目錄
│   ├── index.html      # 前端主頁面
│   ├── script.js       # 前端 JavaScript 邏輯
│   └── style.css       # 前端樣式表
└── stashup.db          # SQLite 資料庫檔案 (由應用程式自動生成)
```

## 使用技術

*   **後端:** Python, FastAPI, SQLAlchemy, SQLite, Passlib (bcrypt), PyJWT
*   **前端:** HTML5, CSS3 (Bootstrap 5), JavaScript, Chart.js
*   **資料庫:** SQLite

## 檔案清單與簡短說明

*   [`main.py`](main.py):
    *   FastAPI 應用程式的核心檔案。
    *   定義了資料庫模型 (User, Transaction, Category)。
    *   包含了使用者認證 (註冊、登入、JWT Token) 的 API 端點。
    *   提供了交易記錄 (新增、讀取、更新、刪除、匯入、匯出) 的 API 端點。
    *   提供了分類管理 (新增、讀取、更新、刪除) 的 API 端點。
    *   處理靜態檔案的服務。
    *   包含應用程式啟動時的預設分類種子數據邏輯。
*   [`requirements.txt`](requirements.txt): 列出了所有 Python 依賴套件，用於 `pip install -r requirements.txt`。
*   [`run.bat`](run.bat): Windows 批次檔，用於啟動 Uvicorn 伺服器。
*   [`todolist.md`](todolist.md): 專案開發過程中的任務追蹤清單。
*   [`wrangler.toml`](wrangler.toml): Cloudflare Workers 的設定檔，用於部署到 Cloudflare (如果使用)。
*   [`static/index.html`](static/index.html): 應用程式的前端使用者介面，包含儀表板、交易列表、篩選器、模態視窗等。
*   [`static/script.js`](static/script.js): 處理前端邏輯，包括 API 請求、DOM 操作、資料渲染、圖表繪製以及使用者認證流程。
*   [`static/style.css`](static/style.css): 應用程式的自訂 CSS 樣式。
*   `stashup.db`: SQLite 資料庫檔案，由 SQLAlchemy 自動生成和管理，用於儲存使用者、交易和分類資料。

## 安裝及執行方式

### 前置條件

*   Python 3.9+
*   pip (Python 套件管理器)

### 安裝步驟

1.  **複製專案:**
    ```bash
    git clone <專案的 Git 儲存庫 URL>
    cd StashUp
    ```
2.  **建立並啟用虛擬環境 (推薦):**
    ```bash
    python -m venv .venv
    # Windows
    .\.venv\Scripts\activate
    # macOS/Linux
    # source ./.venv/bin/activate
    ```
3.  **安裝依賴套件:**
    ```bash
    pip install -r requirements.txt
    ```
    如果遇到 `bcrypt` 相關錯誤，請確保已安裝 `bcrypt`：
    ```bash
    pip install bcrypt
    ```

### 執行應用程式

1.  **啟動 FastAPI 伺服器:**
    在專案根目錄下，執行以下命令：
    ```bash
    python -m uvicorn main:app --host 0.0.0.0 --reload
    ```
    這將啟動開發伺服器，並在程式碼變更時自動重新載入。

2.  **訪問應用程式:**
    打開您的網頁瀏覽器，訪問 `http://localhost:8000`。

### 注意事項

*   首次運行時，`stashup.db` 檔案將會自動生成。
*   如果資料庫模型有變更，您可能需要手動刪除 `stashup.db` 檔案，讓應用程式重新創建資料庫結構。
*   `SECRET_KEY` 在 `main.py` 中目前是硬編碼的，在生產環境中應從環境變數中載入以提高安全性。