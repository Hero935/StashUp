/**
 * @file main.js
 * @description 應用程式的主入口檔案，負責初始化、狀態管理和協調各個模組。
 */

import * as DOM from './dom-elements.js';
import * as API from './api-service.js';
import * as Utils from './utils.js';
import * as UI from './render-ui.js';
import { setupEventListeners, getFilteredTransactions } from './event-handlers.js';

// --- Application State ---
let appState = {
    allTransactions: [],
    categories: { expense: [], income: [] },
    editingTransactionId: null,
    authToken: null,
    currentUsername: null,
    expenseChart: null // Chart.js 實例
};

/**
 * @function updateAppState
 * @description 更新應用程式狀態。
 * @param {Object} newState - 新的狀態物件，將與現有狀態合併。
 */
const updateAppState = (newState) => {
    appState = { ...appState, ...newState };
};

/**
 * @function refreshData
 * @description 刷新所有應用程式資料並重新渲染 UI。
 */
const refreshData = async () => {
    try {
        if (appState.authToken) {
            const [transactionsData, categoriesData] = await Promise.all([
                API.getTransactions(),
                API.getCategories()
            ]);
            console.log('Transactions data from API:', transactionsData);
            updateAppState({ allTransactions: transactionsData, categories: categoriesData });
            console.log('Current appState.allTransactions:', appState.allTransactions);
        } else {
            updateAppState({ allTransactions: [], categories: { expense: [], income: [] } });
        }
        
        const filteredTransactions = getFilteredTransactions(
            appState.allTransactions,
            DOM.filterPeriodEl.value,
            DOM.filterCategoryEl.value,
            DOM.filterKeywordEl.value,
            DOM.startDateEl.value,
            DOM.endDateEl.value
        );

        UI.renderCategories(appState.categories);
        UI.updateDashboard(filteredTransactions);
        UI.renderTransactions(filteredTransactions);
        if (DOM.chartContainer.style.display !== 'none') {
            UI.updateChart(filteredTransactions);
        }
    } catch (error) {
        console.error('Failed to refresh data:', error);
        // 如果是未經授權錯誤，則清除 token 並更新 UI
        if (error.message === 'Unauthorized') {
            Utils.clearAuthTokenFromStorage();
            API.clearAuthToken();
            updateAppState({ authToken: null, currentUsername: null });
            UI.renderAuthUI(appState.currentUsername);
            UI.renderInitialMessageForLoggedOut();
        }
    }
};

/**
 * @function init
 * @description 應用程式初始化函式。
 */
const init = async () => {
    const storedToken = localStorage.getItem('authToken'); // 直接從 localStorage 獲取
    if (storedToken) {
        API.setAuthToken(storedToken);
        const decodedToken = Utils.parseJwt(storedToken);
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) { // 檢查 token 是否過期
            updateAppState({ authToken: storedToken, currentUsername: decodedToken.sub });
        } else {
            API.clearAuthToken(); // 使用 API 服務的清除函式
            updateAppState({ authToken: null, currentUsername: null }); // 明確設置為 null
        }
    }

    // 初始化 Bootstrap Modal 實例
    const transactionModal = new bootstrap.Modal(DOM.transactionModalEl);
    const authModal = new bootstrap.Modal(DOM.authModalEl);

    // 設定事件監聽器，並傳入 appState 和 refreshData 函式
    setupEventListeners(() => appState, refreshData, updateAppState);

    // 初始渲染 UI
    UI.renderAuthUI(appState.currentUsername);
    if (appState.currentUsername) {
        await refreshData();
    } else {
        updateAppState({ allTransactions: [], categories: { expense: [], income: [] } }); // 確保初始狀態為空
        UI.renderInitialMessageForLoggedOut();
    }

    // 設定交易日期預設為今天
    DOM.transactionDateEl.valueAsDate = new Date();
};

// 當 DOM 完全載入後執行初始化
document.addEventListener('DOMContentLoaded', init);