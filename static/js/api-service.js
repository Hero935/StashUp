/**
 * @file api-service.js
 * @description 負責處理所有與後端 API 互動的邏輯。
 */

let authToken = null; // 應用程式的認證 token

/**
 * @function setAuthToken
 * @description 設定認證 token。
 * @param {string} token - JWT 認證 token。
 */
export const setAuthToken = (token) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

/**
 * @function clearAuthToken
 * @description 清除認證 token。
 */
export const clearAuthToken = () => {
    authToken = null;
};

/**
 * @function request
 * @description 發送 API 請求的通用函式。
 * @param {string} url - 請求的 URL。
 * @param {Object} options - 請求選項，例如 method, body, headers 等。
 * @returns {Promise<Object>} - 包含響應資料的 Promise。
 * @throws {Error} - 如果請求失敗或未經授權。
 */
export const request = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        alert('請先登入。');
        // 在這裡不直接清除 token 或渲染 UI，而是讓調用者處理
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
    }
    return response.json();
};

/**
 * @function register
 * @description 註冊新使用者。
 * @param {string} username - 使用者名稱。
 * @param {string} password - 密碼。
 * @returns {Promise<Object>} - 註冊成功的響應。
 */
export const register = (username, password) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
});

/**
 * @function login
 * @description 使用者登入並獲取認證 token。
 * @param {string} username - 使用者名稱。
 * @param {string} password - 密碼。
 * @returns {Promise<Object>} - 包含 access_token 的響應。
 * @throws {Error} - 如果登入失敗。
 */
export const login = async (username, password) => {
    const response = await fetch('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }
    const data = await response.json();
    setAuthToken(data.access_token); // 直接在這裡設定 token
    return data;
};

/**
 * @function getTransactions
 * @description 獲取交易紀錄。
 * @param {string} query - 查詢字串 (可選)。
 * @returns {Promise<Array>} - 交易紀錄陣列。
 */
export const getTransactions = (query = '') => {
    const url = query ? `/api/transactions?query=${encodeURIComponent(query)}` : '/api/transactions';
    return request(url);
};

/**
 * @function getCategories
 * @description 獲取分類列表。
 * @returns {Promise<Object>} - 包含收入和支出分類的物件。
 */
export const getCategories = () => request('/api/categories');

/**
 * @function createTransaction
 * @description 創建新的交易紀錄。
 * @param {Object} data - 交易資料。
 * @returns {Promise<Object>} - 新創建的交易紀錄。
 */
export const createTransaction = (data) => request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
});

/**
 * @function updateTransaction
 * @description 更新現有交易紀錄。
 * @param {number} id - 交易 ID。
 * @param {Object} data - 更新後的交易資料。
 * @returns {Promise<Object>} - 更新後的交易紀錄。
 */
export const updateTransaction = (id, data) => request(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
});

/**
 * @function deleteTransaction
 * @description 刪除交易紀錄。
 * @param {number} id - 交易 ID。
 * @returns {Promise<Object>} - 刪除成功的響應。
 */
export const deleteTransaction = (id) => request(`/api/transactions/${id}`, { method: 'DELETE' });

/**
 * @function createCategory
 * @description 創建新的分類。
 * @param {Object} data - 分類資料。
 * @returns {Promise<Object>} - 新創建的分類。
 */
export const createCategory = (data) => request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data)
});

/**
 * @function deleteCategory
 * @description 刪除分類。
 * @param {string} type - 分類類型 ('income' 或 'expense')。
 * @param {string} name - 分類名稱。
 * @returns {Promise<Object>} - 刪除成功的響應。
 */
export const deleteCategory = (type, name) => request(`/api/categories/${type}/${name}`, { method: 'DELETE' });

/**
 * @function deleteUserAccount
 * @description 刪除使用者帳號及所有相關資料。
 * @returns {Promise<Object>} - 刪除成功的響應。
 */
export const deleteUserAccount = () => request('/auth/delete-account', { method: 'DELETE' });

/**
 * @function exportUserData
 * @description 匯出使用者所有資料（交易紀錄和自訂分類）。
 * @returns {Promise<Object>} - 包含使用者資料的物件。
 */
export const exportUserData = () => request('/auth/export-data');

/**
 * @function importUserData
 * @description 匯入使用者資料（交易紀錄和自訂分類）。
 * @param {Object} data - 要匯入的使用者資料。
 * @returns {Promise<Object>} - 匯入結果的響應。
 */
export const importUserData = (data) => request('/auth/import-data', {
    method: 'POST',
    body: JSON.stringify(data)
});