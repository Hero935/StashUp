/**
 * @file render-ui.js
 * @description 負責所有使用者介面 (UI) 的渲染邏輯。
 */

import {
    expenseCategoryListEl,
    incomeCategoryListEl,
    filterCategoryEl,
    transactionTypeEl,
    transactionCategoryEl,
    transactionsListEl,
    totalIncomeEl,
    totalExpenseEl,
    balanceEl,
    expenseChartCanvas,
    chartContainer,
    usernameDisplay,
    mainContent,
    loginRegisterBtn,
    logoutBtn
} from './dom-elements.js';
import { formatCurrency, formatDate } from './utils.js';

let expenseChartInstance; // Chart.js 實例

/**
 * @function renderCategories
 * @description 渲染收入和支出分類列表，並更新篩選器和交易表單中的分類下拉選單。
 * @param {Object} categories - 包含收入和支出分類的物件。
 * @param {Function} handleDeleteCategory - 刪除分類的回調函式。
 * @param {Function} updateTransactionCategoryDropdown - 更新交易分類下拉選單的回調函式。
 */
export const renderCategories = (categories) => {
    expenseCategoryListEl.innerHTML = categories.expense.map(cat => `
        <li class="list-group-item">${cat} <button class="btn-icon float-end" data-category-type="expense" data-category-name="${cat}"><i class="bi bi-trash"></i></button></li>
    `).join('');
    incomeCategoryListEl.innerHTML = categories.income.map(cat => `
        <li class="list-group-item">${cat} <button class="btn-icon float-end" data-category-type="income" data-category-name="${cat}"><i class="bi bi-trash"></i></button></li>
    `).join('');

    const allCats = [...categories.expense, ...categories.income];
    const uniqueCats = [...new Set(allCats)];
    filterCategoryEl.innerHTML = '<option value="all">全部分類</option>' + uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    updateTransactionCategoryDropdown(categories); // 傳入 categories
};

/**
 * @function updateTransactionCategoryDropdown
 * @description 根據選定的交易類型 (收入/支出) 更新交易表單中的分類下拉選單。
 * @param {Object} categories - 包含收入和支出分類的物件。
 */
export const updateTransactionCategoryDropdown = (categories) => {
    const type = transactionTypeEl.value;
    const cats = categories[type] || [];
    transactionCategoryEl.innerHTML = cats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
    transactionsListEl.innerHTML = '';
    if (filteredTransactions.length === 0) {
        transactionsListEl.innerHTML = '<li class="list-group-item text-center p-3">尚無符合條件的交易紀錄</li>';
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
        transactionsListEl.appendChild(li);
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

    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
    balanceEl.textContent = formatCurrency(balance);
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
        const expenseChartCanvas = document.getElementById('expense-chart');
        if (expenseChartCanvas) {
            expenseChartInstance = new Chart(expenseChartCanvas.getContext('2d'), {
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
        } else {
            console.error('Canvas element with ID "expense-chart" not found.');
        }
    }
};

/**
 * @function renderAuthUI
 * @description 根據使用者登入狀態渲染認證相關 UI。
 * @param {string|null} currentUsername - 當前登入的使用者名稱，如果未登入則為 null。
 */
export const renderAuthUI = (currentUsername) => {
    if (currentUsername) {
        usernameDisplay.textContent = `歡迎, ${currentUsername}`;
        loginRegisterBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        mainContent.style.display = 'block'; // 顯示主要內容
    } else {
        usernameDisplay.textContent = '';
        loginRegisterBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        mainContent.style.display = 'none'; // 隱藏主要內容
    }
};

/**
 * @function renderInitialMessageForLoggedOut
 * @description 當使用者未登入時，顯示提示訊息。
 */
export const renderInitialMessageForLoggedOut = () => {
    transactionsListEl.innerHTML = '<li class="list-group-item text-center p-3">請登入以查看交易紀錄。</li>';
};