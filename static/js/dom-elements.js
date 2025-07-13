/**
 * @file dom-elements.js
 * @description 負責選取和管理應用程式中所有需要操作的 DOM 元素。
 */

// --- DOM Elements ---
export const transactionForm = document.getElementById('transaction-form');
export const transactionModalEl = document.getElementById('transaction-modal'); // 將其命名為 El 以區分實例
export const transactionModalLabel = document.getElementById('transaction-modal-label');
export const balanceEl = document.getElementById('balance');
export const totalIncomeEl = document.getElementById('total-income');
export const totalExpenseEl = document.getElementById('total-expense');
export const transactionsListEl = document.getElementById('transactions');
export const filterPeriodEl = document.getElementById('filter-period');
export const filterCategoryEl = document.getElementById('filter-category');
export const filterKeywordEl = document.getElementById('filter-keyword');
export const transactionTypeEl = document.getElementById('transaction-type');
export const transactionCategoryEl = document.getElementById('transaction-category');
export const toggleChartBtn = document.getElementById('toggle-chart-btn');
export const chartContainer = document.getElementById('chart-container');
export const expenseChartCanvas = document.getElementById('expense-chart');
export const customDateRange = document.getElementById('custom-date-range');
export const startDateEl = document.getElementById('start-date');
export const endDateEl = document.getElementById('end-date');

export const categoryForm = document.getElementById('add-category-form');
export const expenseCategoryListEl = document.getElementById('expense-category-list');
export const incomeCategoryListEl = document.getElementById('income-category-list');

// Auth elements
export const authModalEl = document.getElementById('auth-modal'); // 將其命名為 El 以區分實例
export const loginForm = document.getElementById('login-form');
export const registerForm = document.getElementById('register-form');
export const logoutBtn = document.getElementById('logout-btn');
export const loginRegisterBtn = document.getElementById('login-register-btn');
export const usernameDisplay = document.getElementById('username-display');
export const mainContent = document.querySelector('main.container');


// 交易模態框中的輸入欄位
export const transactionIdEl = document.getElementById('transaction-id');
export const transactionDescriptionEl = document.getElementById('transaction-description');
export const transactionAmountEl = document.getElementById('transaction-amount');
export const transactionDateEl = document.getElementById('transaction-date');

// 分類模態框中的輸入欄位
export const newCategoryNameEl = document.getElementById('new-category-name');
export const newCategoryTypeEl = document.getElementById('new-category-type');

// 登入/註冊模態框中的輸入欄位
export const loginUsernameEl = document.getElementById('login-username');
export const loginPasswordEl = document.getElementById('login-password');
export const registerUsernameEl = document.getElementById('register-username');
export const registerPasswordEl = document.getElementById('register-password');