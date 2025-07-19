/**
 * @file dom-elements.js
 * @description 負責選取和管理應用程式中所有需要操作的 DOM 元素。
 */

// --- DOM Elements ---
// 將所有 DOM 元素定義為可變的 let 變數，並在 initDOM 函數中賦值
export let transactionForm;
export let transactionModalEl;
export let transactionModalLabel;
export let balanceEl;
export let totalIncomeEl;
export let totalExpenseEl;
export let transactionsListEl;
export let filterPeriodEl;
export let filterCategoryEl;
export let filterKeywordEl;
export let transactionTypeEl;
export let transactionCategoryEl;
export let toggleChartBtn;
export let toggleUserManagementBtn;
export let chartContainer; // 這是 chart-display 區塊的容器
export let userManagementSection;
export let expenseChartCanvas;
export let customDateRange;
export let startDateEl;
export let endDateEl;
export let chartDisplaySection; // 新增 chart-display 元素

export let categoryForm;
export let expenseCategoryListEl;
export let incomeCategoryListEl;

// Auth elements
export let authModalEl;
export let loginForm;
export let registerForm;
export let logoutBtn;
export let loginRegisterBtn;
export let usernameDisplay;
export let mainContent;

// 交易模態框中的輸入欄位
export let transactionIdEl;
export let transactionDescriptionEl;
export let transactionAmountEl;
export let transactionDateEl;

// 分類模態框中的輸入欄位
export let newCategoryNameEl;
export let newCategoryTypeEl;

// 登入/註冊模態框中的輸入欄位
export let loginUsernameEl;
export let loginPasswordEl;
export let registerUsernameEl;
export let registerPasswordEl;

/**
 * @function initDOMElements
 * @description 初始化所有 DOM 元素的引用。此函數應在 DOMContentLoaded 事件觸發後調用。
 */
export const initDOMElements = () => {
    transactionForm = document.getElementById('transaction-form');
    transactionModalEl = document.getElementById('transaction-modal');
    transactionModalLabel = document.getElementById('transaction-modal-label');
    balanceEl = document.getElementById('balance');
    totalIncomeEl = document.getElementById('total-income');
    totalExpenseEl = document.getElementById('total-expense');
    transactionsListEl = document.getElementById('transactions');
    filterPeriodEl = document.getElementById('filter-period');
    filterCategoryEl = document.getElementById('filter-category');
    filterKeywordEl = document.getElementById('filter-keyword');
    transactionTypeEl = document.getElementById('transaction-type');
    transactionCategoryEl = document.getElementById('transaction-category');
    toggleChartBtn = document.getElementById('toggle-chart-btn');
    toggleUserManagementBtn = document.getElementById('toggle-user-management-btn');
    chartContainer = document.getElementById('chart-container'); // 這是 canvas 的父容器
    userManagementSection = document.getElementById('user-management');
    expenseChartCanvas = document.getElementById('expense-chart');
    customDateRange = document.getElementById('custom-date-range');
    startDateEl = document.getElementById('start-date');
    endDateEl = document.getElementById('end-date');
    chartDisplaySection = document.getElementById('chart-display'); // 獲取 chart-display 區塊

    categoryForm = document.getElementById('add-category-form');
    expenseCategoryListEl = document.getElementById('expense-category-list');
    incomeCategoryListEl = document.getElementById('income-category-list');

    // Auth elements
    authModalEl = document.getElementById('auth-modal');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    logoutBtn = document.getElementById('logout-btn');
    loginRegisterBtn = document.getElementById('login-register-btn');
    usernameDisplay = document.getElementById('username-display');
    mainContent = document.querySelector('main.container');

    // 交易模態框中的輸入欄位
    transactionIdEl = document.getElementById('transaction-id');
    transactionDescriptionEl = document.getElementById('transaction-description');
    transactionAmountEl = document.getElementById('transaction-amount');
    transactionDateEl = document.getElementById('transaction-date');

    // 分類模態框中的輸入欄位
    newCategoryNameEl = document.getElementById('new-category-name');
    newCategoryTypeEl = document.getElementById('new-category-type');

    // 登入/註冊模態框中的輸入欄位
    loginUsernameEl = document.getElementById('login-username');
    loginPasswordEl = document.getElementById('login-password');
    registerUsernameEl = document.getElementById('register-username');
    registerPasswordEl = document.getElementById('register-password');
};