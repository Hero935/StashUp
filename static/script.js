document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const transactionForm = document.getElementById('transaction-form');
    const transactionModal = new bootstrap.Modal(document.getElementById('transaction-modal'));
    const transactionModalLabel = document.getElementById('transaction-modal-label');
    const balanceEl = document.getElementById('balance');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const transactionsListEl = document.getElementById('transactions');
    const filterPeriodEl = document.getElementById('filter-period');
    const filterCategoryEl = document.getElementById('filter-category');
    const filterKeywordEl = document.getElementById('filter-keyword');
    const transactionTypeEl = document.getElementById('transaction-type');
    const transactionCategoryEl = document.getElementById('transaction-category');
    const toggleChartBtn = document.getElementById('toggle-chart-btn');
    const chartContainer = document.getElementById('chart-container');
    const customDateRange = document.getElementById('custom-date-range');
    const startDateEl = document.getElementById('start-date');
    const endDateEl = document.getElementById('end-date');
    
    const categoryForm = document.getElementById('add-category-form');
    const expenseCategoryListEl = document.getElementById('expense-category-list');
    const incomeCategoryListEl = document.getElementById('income-category-list');

    // Auth elements
    const authModal = new bootstrap.Modal(document.getElementById('auth-modal'));
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginRegisterBtn = document.getElementById('login-register-btn');
    const usernameDisplay = document.getElementById('username-display');
    const mainContent = document.querySelector('main.container');

    const expenseChartCanvas = document.getElementById('expense-chart').getContext('2d');
    let expenseChart;

    // --- Application State ---
    let allTransactions = [];
    let categories = { expense: [], income: [] };
    let editingTransactionId = null;
    let authToken = null;
    let currentUsername = null;

    // --- API Communication ---
    const api = {
        request: async (url, options = {}) => {
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
                clearAuthToken();
                renderAuthUI();
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'API request failed');
            }
            return response.json();
        },
        register: (username, password) => api.request('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }),
        login: async (username, password) => {
            const response = await fetch('/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username, password })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }
            const data = await response.json();
            saveAuthToken(data.access_token);
            currentUsername = username;
            return data;
        },
        getTransactions: (query = '') => {
            const url = query ? `/api/transactions?query=${encodeURIComponent(query)}` : '/api/transactions';
            return api.request(url);
        },
        getCategories: () => api.request('/api/categories'),
        createTransaction: (data) => api.request('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateTransaction: (id, data) => api.request(`/api/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deleteTransaction: (id) => api.request(`/api/transactions/${id}`, { method: 'DELETE' }),
        createCategory: (data) => api.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        deleteCategory: (type, name) => api.request(`/api/categories/${type}/${name}`, { method: 'DELETE' }),
    };

    // --- Utility Functions ---
    const formatCurrency = (num) => `$${Math.round(Number(num))}`;
    const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const saveAuthToken = (token) => {
        localStorage.setItem('authToken', token);
        authToken = token;
    };

    const getAuthToken = () => {
        return localStorage.getItem('authToken');
    };

    const clearAuthToken = () => {
        localStorage.removeItem('authToken');
        authToken = null;
        currentUsername = null;
    };

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    // --- Rendering Functions ---
    const renderCategories = () => {
        expenseCategoryListEl.innerHTML = categories.expense.map(cat => `
            <li class="list-group-item">${cat} <button class="btn-icon float-end" onclick="handleDeleteCategory('expense', '${cat}')"><i class="bi bi-trash"></i></button></li>
        `).join('');
        incomeCategoryListEl.innerHTML = categories.income.map(cat => `
            <li class="list-group-item">${cat} <button class="btn-icon float-end" onclick="handleDeleteCategory('income', '${cat}')"><i class="bi bi-trash"></i></button></li>
        `).join('');

        const allCats = [...categories.expense, ...categories.income];
        const uniqueCats = [...new Set(allCats)];
        filterCategoryEl.innerHTML = '<option value="all">全部分類</option>' + uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        
        updateTransactionCategoryDropdown();
    };

    const updateTransactionCategoryDropdown = () => {
        const type = transactionTypeEl.value;
        const cats = categories[type] || [];
        transactionCategoryEl.innerHTML = cats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    };

    const renderTransactions = (filteredTransactions) => {
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
                        <button class="btn-icon" onclick="showEditModal(${t.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn-icon" onclick="handleCopyTransaction(${t.id})"><i class="bi bi-copy"></i></button>
                        <button class="btn-icon" onclick="handleDeleteTransaction(${t.id})"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            `;
            transactionsListEl.appendChild(li);
        });
    };

    const updateDashboard = (filteredTransactions) => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        totalIncomeEl.textContent = formatCurrency(income);
        totalExpenseEl.textContent = formatCurrency(expense);
        balanceEl.textContent = formatCurrency(balance);
    };

    const updateChart = (filteredTransactions) => {
        const expenseData = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);

        if (expenseChart) {
            expenseChart.destroy();
        }
        
        if (labels.length > 0) {
            expenseChart = new Chart(expenseChartCanvas, {
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
        }
    };
    
    const renderUI = () => {
        const filteredTransactions = getFilteredTransactions();
        renderCategories();
        updateDashboard(filteredTransactions);
        renderTransactions(filteredTransactions);
        if (chartContainer.style.display !== 'none') {
            updateChart(filteredTransactions);
        }
    };

    // --- Event Handlers & Logic ---
    const getFilteredTransactions = () => {
        const period = filterPeriodEl.value;
        const category = filterCategoryEl.value;
        const keyword = filterKeywordEl.value.toLowerCase();
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
                    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // 假設週日為一週的第一天
                    const lastDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                    periodMatch = transactionDate >= firstDayOfWeek && transactionDate <= lastDayOfWeek;
                    break;
                case 'this-month':
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    periodMatch = transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
                    break;
                case 'this-year':
                    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
                    periodMatch = transactionDate >= firstDayOfYear && transactionDate <= now;
                    break;
                case 'custom':
                    const startDate = startDateEl.value ? new Date(startDateEl.value + 'T00:00:00') : null;
                    const endDate = endDateEl.value ? new Date(endDateEl.value + 'T00:00:00') : null;
                    periodMatch = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
                    break;
            }
            const categoryMatch = category === 'all' || t.category === category;
            const keywordMatch = !keyword || t.description.toLowerCase().includes(keyword) || t.category.toLowerCase().includes(keyword);
            return periodMatch && categoryMatch && keywordMatch;
        });
    };

    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const transactionData = {
            type: document.getElementById('transaction-type').value,
            description: document.getElementById('transaction-description').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            date: document.getElementById('transaction-date').value,
        };

        if (!transactionData.description || !transactionData.amount || !transactionData.category || !transactionData.date) {
            alert('請填寫所有欄位');
            return;
        }

        try {
            if (editingTransactionId) {
                await api.updateTransaction(editingTransactionId, transactionData);
            } else {
                await api.createTransaction(transactionData);
            }
            await refreshData();
            transactionModal.hide();
        } catch (error) {
            console.error('Failed to save transaction:', error);
            alert('儲存失敗，請稍後再試');
        }
    });

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryData = {
            name: document.getElementById('new-category-name').value.trim(),
            type: document.getElementById('new-category-type').value,
        };

        if (!categoryData.name) {
            alert('請輸入分類名稱');
            return;
        }
        if (categories[categoryData.type].includes(categoryData.name)) {
            alert('此分類已存在');
            return;
        }

        try {
            await api.createCategory(categoryData);
            await refreshData();
            categoryForm.reset();
        } catch (error) {
            console.error('Failed to create category:', error);
            alert('新增分類失敗');
        }
    });

    transactionTypeEl.addEventListener('change', updateTransactionCategoryDropdown);
    filterPeriodEl.addEventListener('change', () => {
        if (filterPeriodEl.value === 'custom') {
            customDateRange.style.display = 'block';
        } else {
            customDateRange.style.display = 'none';
        }
        renderUI();
    });
    startDateEl.addEventListener('change', renderUI);
    endDateEl.addEventListener('change', renderUI);
    filterCategoryEl.addEventListener('change', renderUI);
    filterKeywordEl.addEventListener('input', renderUI); // 新增關鍵字輸入事件監聽器

    toggleChartBtn.addEventListener('click', () => {
        if (chartContainer.style.display === 'none') {
            chartContainer.style.display = 'block';
            updateChart(getFilteredTransactions());
            toggleChartBtn.innerHTML = '<i class="bi bi-eye-slash"></i> 隱藏分析';
        } else {
            chartContainer.style.display = 'none';
            toggleChartBtn.innerHTML = '<i class="bi bi-pie-chart"></i> 顯示分析';
        }
    });

    // --- Global Functions for inline event handlers ---
    window.showEditModal = (id) => {
        const transaction = allTransactions.find(t => t.id === id);
        if (!transaction) return;

        editingTransactionId = id;
        transactionModalLabel.textContent = '編輯交易';
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-type').value = transaction.type;
        updateTransactionCategoryDropdown(); // Update dropdown first
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-category').value = transaction.category;

        transactionModal.show();
    };

    /**
     * @function handleCopyTransaction
     * @description 複製現有交易的資料，將日期設定為今天，然後彈出模態視窗讓使用者修改。
     * @param {number} id - 要複製的交易ID。
     */
    window.handleCopyTransaction = (id) => {
        const transaction = allTransactions.find(t => t.id === id);
        if (!transaction) return;

        editingTransactionId = null; // 複製是新增，所以不設定編輯ID
        transactionModalLabel.textContent = '複製交易 (修改後新增)';
        document.getElementById('transaction-id').value = ''; // 清空ID
        document.getElementById('transaction-type').value = transaction.type;
        updateTransactionCategoryDropdown();
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-amount').value = transaction.amount;
        
        // 自動帶入今日日期
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        document.getElementById('transaction-date').value = `${year}-${month}-${day}`;
        
        document.getElementById('transaction-category').value = transaction.category;

        transactionModal.show();
    };

    /**
     * @function handleDeleteTransaction
     * @description 處理刪除交易的邏輯。
     * @param {number} id - 要刪除的交易ID。
     */
    window.handleDeleteTransaction = async (id) => {
        if (confirm('確定要刪除這筆交易嗎？')) {
            try {
                await api.deleteTransaction(id);
                await refreshData();
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                alert('刪除失敗');
            }
        }
    };

    window.handleDeleteCategory = async (type, name) => {
        if (confirm(`確定要刪除分類 "${name}" 嗎？\n使用此分類的交易將被歸類為 "其他"。`)) {
            try {
                await api.deleteCategory(type, name);
                await refreshData();
            } catch (error) {
                console.error('Failed to delete category:', error);
                alert('刪除失敗');
            }
        }
    };
    
    document.getElementById('transaction-modal').addEventListener('hidden.bs.modal', () => {
        transactionModalLabel.textContent = '新增交易';
        editingTransactionId = null;
        transactionForm.reset();
        document.getElementById('transaction-date').valueAsDate = new Date();
        updateTransactionCategoryDropdown();
    });
    
    // --- Event Handlers for Auth ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            await api.login(username, password);
            authModal.hide();
            await refreshData();
            renderAuthUI();
        } catch (error) {
            alert(error.message);
            console.error('Login failed:', error);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            await api.register(username, password);
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

    logoutBtn.addEventListener('click', () => {
        clearAuthToken();
        renderAuthUI();
        // Clear existing data and re-render UI for logged out state
        allTransactions = [];
        categories = { expense: [], income: [] };
        renderUI();
        transactionsListEl.innerHTML = '<li class="list-group-item text-center p-3">請登入以查看交易紀錄。</li>';
    });

    // --- UI State Management for Auth ---
    const renderAuthUI = () => {
        authToken = getAuthToken();
        if (authToken) {
            const payload = parseJwt(authToken);
            currentUsername = payload ? payload.sub : '使用者';
            usernameDisplay.textContent = `歡迎, ${currentUsername}`;
            usernameDisplay.style.display = 'inline';
            logoutBtn.style.display = 'inline';
            loginRegisterBtn.style.display = 'none';
            mainContent.style.display = 'block'; // Show main content
        } else {
            usernameDisplay.style.display = 'none';
            logoutBtn.style.display = 'none';
            loginRegisterBtn.style.display = 'inline';
            mainContent.style.display = 'none'; // Hide main content
            authModal.show(); // Show login/register modal
        }
    };

    // --- Initialization ---
    /**
     * @function refreshData
     * @description 從 API 獲取最新的交易和分類數據，並更新 UI。
     */
    /**
     * @function refreshData
     * @description 從 API 獲取最新的交易和分類數據，並更新 UI。
     */
    const refreshData = async () => {
        // 如果沒有認證 token，則不發送 API 請求，直接清空數據並更新 UI
        if (!authToken) {
            allTransactions = [];
            categories = { expense: [], income: [] };
            renderUI();
            transactionsListEl.innerHTML = '<li class="list-group-item text-center p-3">請登入以查看交易紀錄。</li>';
            return;
        }

        try {
            const [transactionsData, categoriesData] = await Promise.all([
                api.getTransactions(filterKeywordEl.value), // 傳遞關鍵字給後端
                api.getCategories()
            ]);
            // Ensure allTransactions is an array
            allTransactions = Array.isArray(transactionsData) ? transactionsData : [];
            categories = categoriesData;
            renderUI();
        } catch (error) {
            console.error('Failed to load data:', error);
            // If unauthorized, renderAuthUI will be called by api.request
            if (error.message !== 'Unauthorized') {
                transactionsListEl.innerHTML = '<li class="list-group-item text-center text-danger p-3">無法載入資料，請確認後端伺服器是否已啟動或您是否有權限。</li>';
            }
            // If data loading fails, ensure allTransactions is an empty array to prevent further errors
            allTransactions = [];
            categories = { expense: [], income: [] };
            renderUI(); // Re-render UI with empty data
        }
    };

    const init = () => {
        document.getElementById('transaction-date').valueAsDate = new Date();
        renderAuthUI(); // Render auth UI first
        refreshData(); // Then try to refresh data
    };

    init();
});