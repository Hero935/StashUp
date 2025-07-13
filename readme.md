# StashUp - 個人財務管理應用程式

StashUp 是一個基於 FastAPI 和 SQLite 的個人財務管理應用程式，旨在幫助使用者追蹤收入和支出，管理類別，並提供交易的匯入匯出功能。前端使用 HTML、CSS 和 JavaScript 實現。

## 專案描述

本專案旨在提供一個簡單易用的 Web 應用程式，讓使用者能夠：
- 註冊和登入帳戶
- 記錄收入和支出交易
- 管理自訂交易類別
- 匯入 CSV 格式的交易紀錄
- 匯出交易紀錄為 CSV 檔案
- 查看交易概覽

## 檔案結構

```
.
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py           # 使用者認證相關路由 (註冊、登入)
│   │   ├── categories.py     # 類別管理相關路由 (增、刪、改、查)
│   │   └── transactions.py   # 交易管理相關路由 (增、刪、改、查、匯入、匯出)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── dependencies.py   # FastAPI 依賴注入 (如取得當前使用者)
│   │   └── security.py       # 密碼雜湊、JWT 生成與驗證
│   ├── crud/
│   │   ├── __init__.py
│   │   └── crud.py           # 資料庫操作 (CRUD 邏輯)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py       # 資料庫引擎、會話、Base 聲明、get_db 依賴
│   │   └── models.py         # SQLAlchemy 資料庫模型 (User, Transaction, Category)
│   └── schemas/
│       ├── __init__.py
│       └── schemas.py        # Pydantic 資料模型 (請求/回應模型)
├── static/
│   ├── index.html            # 前端主頁面
│   ├── script.js             # 前端 JavaScript 邏輯
│   └── style.css             # 前端樣式
├── main.py                   # FastAPI 應用程式入口點，整合各模組路由
├── readme.md                 # 專案說明文件
├── requirements.txt          # Python 依賴套件列表
├── .gitignore                # Git 忽略文件
├── .python-version           # pyenv 版本文件
├── run.bat                   # Windows 啟動腳本
├── todolist.md               # 任務清單
└── wrangler.toml             # Cloudflare Wrangler 配置 (如果部署到 Cloudflare Workers)
```

## 使用技術

- **後端**:
    - Python 3.9+
    - FastAPI: 高性能 Web 框架
    - SQLAlchemy: ORM (Object Relational Mapper)
    - SQLite: 輕量級資料庫
    - Passlib: 密碼雜湊
    - PyJWT: JWT (JSON Web Token) 認證
- **前端**:
    - HTML5
    - CSS3
    - JavaScript (Vanilla JS)
- **開發工具**:
    - pip: Python 套件管理器
    - uvicorn: ASGI 伺服器

## 檔案清單簡短說明

- `app/`: 包含所有後端應用程式邏輯的目錄。
    - `app/api/`: 包含所有 API 路由定義。
    - `app/core/`: 包含核心功能，如安全和依賴注入。
    - `app/crud/`: 包含與資料庫互動的 CRUD 操作。
    - `app/models/`: 包含 SQLAlchemy 資料庫模型和資料庫連接設定。
    - `app/schemas/`: 包含 Pydantic 請求和回應資料模型。
- `static/`: 包含前端靜態檔案。
- `main.py`: 應用程式的啟動文件，負責初始化 FastAPI 應用程式並掛載路由。
- `readme.md`: 本專案的說明文件。
- `requirements.txt`: 列出所有 Python 依賴套件。
- `run.bat`: 用於在 Windows 環境下啟動應用程式的批次檔。
- `todolist.md`: 專案任務進度追蹤文件。
- `wrangler.toml`: Cloudflare Workers 的配置檔案，用於部署。

## 安裝及執行方式

### 1. 環境準備

確保您的系統已安裝 Python 3.9 或更高版本。建議使用 `pyenv` 或 `conda` 等工具管理 Python 環境。

### 2. 安裝依賴

```powershell
pip install -r requirements.txt
```

### 3. 啟動應用程式

在專案根目錄下執行以下命令：

```powershell
uvicorn main:app --reload
```

或者，如果您在 Windows 環境下，可以直接執行 `run.bat` 腳本：

```powershell
.\run.bat
```

應用程式將在 `http://127.0.0.1:8000` 上運行。

### 4. 訪問應用程式

在瀏覽器中打開 `http://127.0.0.1:8000` 即可訪問前端介面。

### 5. 資料庫初始化

應用程式首次啟動時，會自動創建 `stashup.db` SQLite 資料庫並填充預設類別。