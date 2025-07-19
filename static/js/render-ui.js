/**
 * @file render-ui.js
 * @description 負責所有使用者介面 (UI) 的渲染邏輯。
 */

import * as DOM from './dom-elements.js'; // 導入整個 DOM 模組
import { formatCurrency, formatDate } from './utils.js';

/**
 * @function toggleSection
 * @description 切換指定區塊的顯示狀態，並更新按鈕文字和圖示。
 * @param {HTMLElement} sectionEl - 要切換顯示狀態的區塊元素。
 * @param {HTMLElement} buttonEl - 觸發切換的按鈕元素。
 * @param {string} showText - 顯示區塊時按鈕的文字。
 * @param {string} hideText - 隱藏區塊時按鈕的文字。
 * @param {string} showIcon - 顯示區塊時按鈕的圖示 HTML。
 * @param {string} hideIcon - 隱藏區塊時按鈕的圖示 HTML。
 */
export const toggleSection = (sectionEl, buttonEl, showText, hideText, showIcon, hideIcon) => {
    if (sectionEl.style.display === 'none') {
        sectionEl.style.display = 'block';
        buttonEl.innerHTML = `${hideIcon} ${hideText}`;
    } else {
        sectionEl.style.display = 'none';
        buttonEl.innerHTML = `${showIcon} ${showText}`;
    }
};

let expenseChartInstance; // Chart.js 實例

/**
 * @function renderCategories
 * @description 渲染收入和支出分類列表，並更新篩選器和交易表單中的分類下拉選單。
 * @param {Object} categories - 包含收入和支出分類的物件。
 * @param {Function} handleDeleteCategory - 刪除分類的回調函式。
 * @param {Function} updateTransactionCategoryDropdown - 更新交易分類下拉選單的回調函式。
 */
export const renderCategories = (categories) => {
    DOM.expenseCategoryListEl.innerHTML = categories.expense.map(cat => `
        <li class="list-group-item">${cat} <button class="btn-icon float-end" data-category-type="expense" data-category-name="${cat}"><i class="bi bi-trash"></i></button></li>
    `).join('');
    DOM.incomeCategoryListEl.innerHTML = categories.income.map(cat => `
        <li class="list-group-item">${cat} <button class="btn-icon float-end" data-category-type="income" data-category-name="${cat}"><i class="bi bi-trash"></i></button></li>
    `).join('');

    const allCats = [...categories.expense, ...categories.income];
    const uniqueCats = [...new Set(allCats)];
    DOM.filterCategoryEl.innerHTML = '<option value="all">全部分類</option>' + uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    updateTransactionCategoryDropdown(categories); // 傳入 categories
};

/**
 * @function updateTransactionCategoryDropdown
 * @description 根據選定的交易類型 (收入/支出) 更新交易表單中的分類下拉選單。
 * @param {Object} categories - 包含收入和支出分類的物件。
 */
export const updateTransactionCategoryDropdown = (categories) => {
    const type = DOM.transactionTypeEl.value;
    const cats = categories[type] || [];
    DOM.transactionCategoryEl.innerHTML = cats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
};

/**
 * @function renderTransactions
 * @description 渲染交易列表。
 * @param {Array} filteredTransactions - 經過篩選的交易紀錄陣列。
 * @param {Function} showEditModal - 顯示編輯模態框的回調函式。
 * @param {Function} handleCopyTransaction - 複製交易的回調函式。
 * @param {Function} handleDeleteTransaction - 刪除交易的回調函式。
 */
export const renderTransactions = (filteredTransactions) => {
    DOM.transactionsListEl.innerHTML = '';
    if (filteredTransactions.length === 0) {
        DOM.transactionsListEl.innerHTML = '<li class="list-group-item text-center p-3">尚無符合條件的交易紀錄</li>';
        return;
    }

    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredTransactions.forEach(t => {
        const isExpense = t.type === 'expense';
        const li = document.createElement('li');
        li.className = 'list-group-item transaction-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <div>
                <span class="fw-bold">${t.description}</span>
                <br>
                <small class="text-muted">${formatDate(t.date)} | <span class="badge rounded-pill text-bg-secondary">${t.category}</span></small>
            </div>
            <div class="text-end">
                <span class="amount-${isExpense ? 'expense' : 'income'}">${isExpense ? '-' : '+'}${formatCurrency(t.amount)}</span>
                <div class="actions">
                    <button class="btn-icon edit-transaction-btn" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon copy-transaction-btn" data-id="${t.id}"><i class="bi bi-copy"></i></button>
                    <button class="btn-icon delete-transaction-btn" data-id="${t.id}"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
        DOM.transactionsListEl.appendChild(li);
    });
};

/**
 * @function updateDashboard
 * @description 更新儀表板上的收入、支出和餘額顯示。
 * @param {Array} filteredTransactions - 經過篩選的交易紀錄陣列。
 */
export const updateDashboard = (filteredTransactions) => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    DOM.totalIncomeEl.textContent = formatCurrency(income);
    DOM.totalExpenseEl.textContent = formatCurrency(expense);
    DOM.balanceEl.textContent = formatCurrency(balance);
};

/**
 * @function updateChart
 * @description 更新支出圓餅圖。
 * @param {Array} filteredTransactions - 經過篩選的交易紀錄陣列。
 */
export const updateChart = (filteredTransactions) => {
    const expenseData = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }
    
    if (labels.length > 0) {
        if (DOM.expenseChartCanvas) {
            // 清除 canvas 的 style 屬性，讓 CSS 規則生效
            DOM.expenseChartCanvas.style.cssText = '';
            // 移除日誌
            expenseChartInstance = new Chart(DOM.expenseChartCanvas.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '支出分類',
                        data: data,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#83D4A8'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });
            console.log('Chart instance created.');
        } else {
            console.error('Canvas element with ID "expense-chart" not found.');
        }
    } else {
        console.log('No expense data to render chart.');
    }
};

/**
 * @function renderAuthUI
 * @description 根據使用者登入狀態渲染認證相關 UI。
 * @param {string|null} currentUsername - 當前登入的使用者名稱，如果未登入則為 null。
 */
export const renderAuthUI = (currentUsername) => {
    if (currentUsername) {
        DOM.usernameDisplay.textContent = `歡迎, ${currentUsername}`;
        DOM.loginRegisterBtn.style.display = 'none';
        DOM.logoutBtn.style.display = 'block';
        DOM.mainContent.style.display = 'block'; // 顯示主要內容
        // 登入後預設顯示交易列表，隱藏圖表和帳號管理
        // 確保 DOM 元素已初始化
        if (DOM.chartDisplaySection) DOM.chartDisplaySection.style.display = 'none';
        if (DOM.userManagementSection) DOM.userManagementSection.style.display = 'none';
        // 重置按鈕文字
        if (DOM.toggleChartBtn) DOM.toggleChartBtn.innerHTML = '<i class="bi bi-pie-chart"></i> 顯示分析';
        if (DOM.toggleUserManagementBtn) DOM.toggleUserManagementBtn.innerHTML = '<i class="bi bi-person-gear"></i> 帳號管理';
    } else {
        DOM.usernameDisplay.textContent = '';
        DOM.loginRegisterBtn.style.display = 'block';
        DOM.logoutBtn.style.display = 'none';
        DOM.mainContent.style.display = 'none'; // 隱藏主要內容
    }
};

/**
 * @function renderInitialMessageForLoggedOut
 * @description 當使用者未登入時，顯示提示訊息。
 */
export const renderInitialMessageForLoggedOut = () => {
    DOM.transactionsListEl.innerHTML = '<li class="list-group-item text-center p-3">請登入以查看交易紀錄。</li>';
};