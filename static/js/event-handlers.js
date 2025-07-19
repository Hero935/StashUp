/**
 * @file event-handlers.js
 * @description 負責處理所有使用者介面事件和相關邏輯。
 */

import * as DOM from './dom-elements.js';
import * as API from './api-service.js';
import * as UI from './render-ui.js';
import { parseJwt } from './utils.js';

// 應用程式狀態 (由 main.js 管理，這裡只作為參考，實際操作會透過傳入的函式)
// let allTransactions = [];
// let categories = { expense: [], income: [] };
// let editingTransactionId = null;
// let authToken = null;
// let currentUsername = null;

/**
 * @function setupEventListeners
 * @description 設定所有主要的事件監聽器。
 * @param {Object} appState - 應用程式狀態物件，包含 allTransactions, categories, editingTransactionId, authToken, currentUsername。
 * @param {Function} refreshData - 刷新資料的回調函式。
 * @param {Function} updateAppState - 更新應用程式狀態的回調函式。
 */
export const setupEventListeners = (getAppState, refreshData, updateAppState) => {
    const transactionModal = new bootstrap.Modal(DOM.transactionModalEl);
    const authModal = new bootstrap.Modal(DOM.authModalEl);

    // --- Transaction Form Events ---
    DOM.transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const transactionData = {
            type: DOM.transactionTypeEl.value,
            description: DOM.transactionDescriptionEl.value,
            amount: parseFloat(DOM.transactionAmountEl.value),
            category: DOM.transactionCategoryEl.value,
            date: DOM.transactionDateEl.value,
        };

        if (!transactionData.description || !transactionData.amount || !transactionData.category || !transactionData.date) {
            alert('請填寫所有欄位');
            return;
        }

        try {
            if (getAppState().editingTransactionId) {
                await API.updateTransaction(getAppState().editingTransactionId, transactionData);
            } else {
                await API.createTransaction(transactionData);
            }
            await refreshData();
            transactionModal.hide();
        } catch (error) {
            console.error('Failed to save transaction:', error);
            alert('儲存失敗，請稍後再試');
        }
    });

    // --- Category Form Events ---
    DOM.categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryData = {
            name: DOM.newCategoryNameEl.value.trim(),
            type: DOM.newCategoryTypeEl.value,
        };

        if (!categoryData.name) {
            alert('請輸入分類名稱');
            return;
        }
        if (getAppState().categories[categoryData.type].includes(categoryData.name)) {
            alert('此分類已存在');
            return;
        }

        try {
            await API.createCategory(categoryData);
            await refreshData();
            DOM.categoryForm.reset();
        } catch (error) {
            console.error('Failed to create category:', error);
            alert('新增分類失敗');
        }
    });

    // --- Filter and Chart Toggle Events ---
    DOM.transactionTypeEl.addEventListener('change', () => UI.updateTransactionCategoryDropdown(getAppState().categories));
    DOM.filterPeriodEl.addEventListener('change', () => {
        if (DOM.filterPeriodEl.value === 'custom') {
            DOM.customDateRange.style.display = 'block';
        } else {
            DOM.customDateRange.style.display = 'none';
        }
        refreshData(); // 觸發資料刷新和 UI 渲染
    });
    DOM.startDateEl.addEventListener('change', refreshData);
    DOM.endDateEl.addEventListener('change', refreshData);
    DOM.filterCategoryEl.addEventListener('change', refreshData);
    DOM.filterKeywordEl.addEventListener('input', refreshData);

    DOM.toggleChartBtn.addEventListener('click', () => {
        UI.toggleSection(DOM.chartDisplaySection, DOM.toggleChartBtn, '顯示分析', '隱藏分析', '<i class="bi bi-pie-chart"></i>', '<i class="bi bi-eye-slash"></i>');
        // 當顯示分析時，隱藏帳號管理
        if (DOM.chartDisplaySection.style.display === 'block') {
            if (DOM.userManagementSection.style.display === 'block') { // 只有當帳號管理是顯示狀態時才隱藏
                UI.toggleSection(DOM.userManagementSection, DOM.toggleUserManagementBtn, '帳號管理', '隱藏帳號管理', '<i class="bi bi-person-gear"></i>', '<i class="bi bi-eye-slash"></i>');
            }
            UI.updateChart(getFilteredTransactions(getAppState().allTransactions, DOM.filterPeriodEl.value, DOM.filterCategoryEl.value, DOM.filterKeywordEl.value, DOM.startDateEl.value, DOM.endDateEl.value));
        }
    });

    DOM.toggleUserManagementBtn.addEventListener('click', () => {
        UI.toggleSection(DOM.userManagementSection, DOM.toggleUserManagementBtn, '帳號管理', '隱藏帳號管理', '<i class="bi bi-person-gear"></i>', '<i class="bi bi-eye-slash"></i>');
        // 當顯示帳號管理時，隱藏分析
        if (DOM.userManagementSection.style.display === 'block') {
            if (DOM.chartDisplaySection.style.display === 'block') { // 只有當圖表是顯示狀態時才隱藏
                UI.toggleSection(DOM.chartDisplaySection, DOM.toggleChartBtn, '顯示分析', '隱藏分析', '<i class="bi bi-pie-chart"></i>', '<i class="bi bi-eye-slash"></i>');
            }
        }
    });

    // --- Global Functions for inline event handlers (需要掛載到 window) ---
    // 這些函式現在將透過事件委派處理，不再直接掛載到 window
    const showEditModal = (id) => {
        console.log('showEditModal called with id:', id);
        const transaction = getAppState().allTransactions.find(t => parseInt(t.id) === id); // 確保兩邊都是數字進行嚴格比較
        if (!transaction) {
            console.error('Transaction not found for id:', id);
            return;
        }
        console.log('Found transaction:', transaction);

        updateAppState({ editingTransactionId: id });
        DOM.transactionModalLabel.textContent = '編輯交易';
        DOM.transactionIdEl.value = transaction.id;
        DOM.transactionTypeEl.value = transaction.type;
        UI.updateTransactionCategoryDropdown(getAppState().categories); // Update dropdown first
        DOM.transactionDescriptionEl.value = transaction.description;
        DOM.transactionAmountEl.value = transaction.amount;
        DOM.transactionDateEl.value = transaction.date;
        DOM.transactionCategoryEl.value = transaction.category;

        transactionModal.show();
    };

    /**
     * @function handleCopyTransaction
     * @description 複製現有交易的資料，將日期設定為今天，然後彈出模態視窗讓使用者修改。
     * @param {number} id - 要複製的交易ID。
     */
    const handleCopyTransaction = (id) => {
        console.log('handleCopyTransaction called with id:', id);
        const transaction = getAppState().allTransactions.find(t => parseInt(t.id) === id); // 確保兩邊都是數字進行嚴格比較
        if (!transaction) {
            console.error('Transaction not found for id:', id);
            return;
        }
        console.log('Found transaction for copy:', transaction);

        updateAppState({ editingTransactionId: null }); // 複製是新增，所以不設定編輯ID
        DOM.transactionModalLabel.textContent = '複製交易 (修改後新增)';
        DOM.transactionIdEl.value = ''; // 清空ID
        DOM.transactionTypeEl.value = transaction.type;
        UI.updateTransactionCategoryDropdown(getAppState().categories);
        DOM.transactionDescriptionEl.value = transaction.description;
        DOM.transactionAmountEl.value = transaction.amount;
        
        // 自動帶入今日日期
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        DOM.transactionDateEl.value = `${year}-${month}-${day}`;
        
        DOM.transactionCategoryEl.value = transaction.category;

        transactionModal.show();
    };

    /**
     * @function handleDeleteTransaction
     * @description 處理刪除交易的邏輯。
     * @param {number} id - 要刪除的交易ID。
     */
    const handleDeleteTransaction = async (id) => {
        if (confirm('確定要刪除這筆交易嗎？')) {
            try {
                await API.deleteTransaction(id);
                await refreshData();
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                alert('刪除失敗');
            }
        }
    };

    // 將 handleDeleteCategory 函式也從 window 移除，並透過事件委派處理
    DOM.expenseCategoryListEl.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-icon');
        if (targetBtn) {
            const categoryType = targetBtn.dataset.categoryType;
            const categoryName = targetBtn.dataset.categoryName;
            if (categoryType && categoryName) {
                handleDeleteCategory(categoryType, categoryName);
            }
        }
    });

    DOM.incomeCategoryListEl.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-icon');
        if (targetBtn) {
            const categoryType = targetBtn.dataset.categoryType;
            const categoryName = targetBtn.dataset.categoryName;
            if (categoryType && categoryName) {
                handleDeleteCategory(categoryType, categoryName);
            }
        }
    });

    const handleDeleteCategory = async (type, name) => {
        if (confirm(`確定要刪除分類 "${name}" 嗎？\n使用此分類的交易將被歸類為 "其他"。`)) {
            try {
                await API.deleteCategory(type, name);
                await refreshData();
            } catch (error) {
                console.error('Failed to delete category:', error);
                alert('刪除失敗');
            }
        }
    };
    
    // 使用事件委派處理交易列表的編輯、複製、刪除按鈕
    DOM.transactionsListEl.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-icon');
        if (targetBtn) {
            const transactionId = parseInt(targetBtn.dataset.id);
            if (targetBtn.classList.contains('edit-transaction-btn')) {
                showEditModal(transactionId);
            } else if (targetBtn.classList.contains('copy-transaction-btn')) {
                handleCopyTransaction(transactionId);
            } else if (targetBtn.classList.contains('delete-transaction-btn')) {
                handleDeleteTransaction(transactionId);
            }
        }
    });

    DOM.transactionModalEl.addEventListener('hidden.bs.modal', () => {
        DOM.transactionModalLabel.textContent = '新增交易';
        updateAppState({ editingTransactionId: null });
        DOM.transactionForm.reset();
        DOM.transactionDateEl.valueAsDate = new Date();
        UI.updateTransactionCategoryDropdown(getAppState().categories);
    });
    
    // --- Event Handlers for Auth ---
    DOM.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = DOM.loginUsernameEl.value;
        const password = DOM.loginPasswordEl.value;

        try {
            const data = await API.login(username, password);
            const decodedToken = parseJwt(data.access_token);
            updateAppState({ authToken: data.access_token, currentUsername: decodedToken.sub });
            authModal.hide();
            await refreshData();
            UI.renderAuthUI(getAppState().currentUsername); // 直接傳入 decodedToken.sub
        } catch (error) {
            alert(error.message);
            console.error('Login failed:', error);
        }
    });

    DOM.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = DOM.registerUsernameEl.value;
        const password = DOM.registerPasswordEl.value;

        try {
            await API.register(username, password);
            alert('註冊成功，請登入！');
            authModal.hide();
            // Optionally switch to login tab after successful registration
            const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
            loginTab.show();
        } catch (error) {
            alert(error.message);
            console.error('Registration failed:', error);
        }
    });

    DOM.logoutBtn.addEventListener('click', () => {
        API.clearAuthToken(); // 清除 API 服務中的 token
        updateAppState({ authToken: null, currentUsername: null, allTransactions: [], categories: { expense: [], income: [] } });
        UI.renderAuthUI(getAppState().currentUsername); // 直接傳入 null 確保 UI 渲染登出狀態
        UI.renderInitialMessageForLoggedOut();
    });

    DOM.loginRegisterBtn.addEventListener('click', () => {
        authModal.show();
    });

    // --- User Management Events ---
    const deleteAccountModal = new bootstrap.Modal(document.getElementById('delete-account-modal'));
    const importDataModal = new bootstrap.Modal(document.getElementById('import-data-modal'));

    document.getElementById('delete-account-btn').addEventListener('click', () => {
        document.getElementById('confirm-username').value = '';
        document.getElementById('confirm-delete-btn').disabled = true;
        deleteAccountModal.show();
    });

    document.getElementById('confirm-username').addEventListener('input', (e) => {
        const username = e.target.value.trim();
        const currentUsername = getAppState().currentUsername;
        document.getElementById('confirm-delete-btn').disabled = username !== currentUsername;
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (confirm('這是最後確認！刪除後將無法復原！')) {
            try {
                await API.deleteUserAccount();
                alert('您的帳號已成功刪除');
                deleteAccountModal.hide();
                API.clearAuthToken();
                updateAppState({ authToken: null, currentUsername: null, allTransactions: [], categories: { expense: [], income: [] } });
                UI.renderAuthUI(null);
                UI.renderInitialMessageForLoggedOut();
            } catch (error) {
                console.error('Failed to delete account:', error);
                alert('刪除帳號失敗：' + error.message);
            }
        }
    });

    document.getElementById('export-data-btn').addEventListener('click', async () => {
        try {
            const userData = await API.exportUserData();
            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stashup-data-${getAppState().currentUsername}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('資料匯出成功！');
        } catch (error) {
            console.error('Failed to export data:', error);
            alert('匯出資料失敗：' + error.message);
        }
    });

    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file').value = '';
        document.getElementById('confirm-import-btn').disabled = true;
        importDataModal.show();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        document.getElementById('confirm-import-btn').disabled = !file || !file.name.endsWith('.json');
    });

    document.getElementById('confirm-import-btn').addEventListener('click', async () => {
        const file = document.getElementById('import-file').files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // 驗證資料格式
            if (!data.transactions || !data.custom_categories) {
                throw new Error('無效的資料格式');
            }

            const result = await API.importUserData(data);
            alert(`資料匯入成功！\n匯入交易：${result.imported_transactions} 筆\n匯入分類：${result.imported_categories} 個`);
            importDataModal.hide();
            await refreshData();
        } catch (error) {
            console.error('Failed to import data:', error);
            alert('匯入資料失敗：' + error.message);
        }
    });
};

/**
 * @function getFilteredTransactions
 * @description 根據篩選條件獲取過濾後的交易紀錄。
 * @param {Array} allTransactions - 所有的交易紀錄陣列。
 * @param {string} period - 篩選期間 (all, today, this-week, this-month, this-year, custom)。
 * @param {string} category - 篩選分類 (all 或特定分類名稱)。
 * @param {string} keyword - 篩選關鍵字。
 * @param {string} startDateStr - 自訂期間的開始日期字串 (YYYY-MM-DD)。
 * @param {string} endDateStr - 自訂期間的結束日期字串 (YYYY-MM-DD)。
 * @returns {Array} - 過濾後的交易紀錄陣列。
 */
export const getFilteredTransactions = (allTransactions, period, category, keyword, startDateStr, endDateStr) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 將時間歸零，以便進行日期比較

    // Ensure allTransactions is an array before filtering
    if (!Array.isArray(allTransactions)) {
        console.warn('allTransactions is not an array, initializing to empty array.');
        allTransactions = [];
    }

    return allTransactions.filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        let periodMatch = false;

        switch (period) {
            case 'all':
                periodMatch = true;
                break;
            case 'today':
                periodMatch = transactionDate.toDateString() === now.toDateString();
                break;
            case 'this-week':
                const tempNowWeek = new Date(now); // 複製 now
                const firstDayOfWeek = new Date(tempNowWeek.setDate(tempNowWeek.getDate() - tempNowWeek.getDay())); // 假設週日為一週的第一天
                const lastDayOfWeek = new Date(tempNowWeek.setDate(tempNowWeek.getDate() - tempNowWeek.getDay() + 6));
                periodMatch = transactionDate >= firstDayOfWeek && transactionDate <= lastDayOfWeek;
                break;
            case 'this-month':
                const tempNowMonth = new Date(now); // 複製 now
                const firstDayOfMonth = new Date(tempNowMonth.getFullYear(), tempNowMonth.getMonth(), 1);
                const lastDayOfMonth = new Date(tempNowMonth.getFullYear(), tempNowMonth.getMonth() + 1, 0);
                periodMatch = transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
                break;
            case 'this-year':
                const tempNowYear = new Date(now); // 複製 now
                const firstDayOfYear = new Date(tempNowYear.getFullYear(), 0, 1);
                const lastDayOfYear = new Date(tempNowYear.getFullYear(), 11, 31); // 今年最後一天
                periodMatch = transactionDate >= firstDayOfYear && transactionDate <= lastDayOfYear;
                break;
            case 'custom':
                const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
                const endDate = endDateStr ? new Date(endDateStr + 'T00:00:00') : null;
                periodMatch = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
                break;
        }
        const categoryMatch = category === 'all' || t.category === category;
        const keywordMatch = !keyword || t.description.toLowerCase().includes(keyword) || t.category.toLowerCase().includes(keyword);
        return periodMatch && categoryMatch && keywordMatch;
    });
};