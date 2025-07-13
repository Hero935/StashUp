/**
 * @file utils.js
 * @description 存放專案中通用的輔助函式。
 */

/**
 * @function formatCurrency
 * @description 將數字格式化為貨幣字串。
 * @param {number} num - 要格式化的數字。
 * @returns {string} - 格式化後的貨幣字串。
 */
export const formatCurrency = (num) => `$${Math.round(Number(num))}`;

/**
 * @function formatDate
 * @description 將日期字串格式化為本地日期字串。
 * @param {string} dateStr - 日期字串 (例如 'YYYY-MM-DD')。
 * @returns {string} - 格式化後的日期字串。
 */
export const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });


/**
 * @function parseJwt
 * @description 解析 JWT token。
 * @param {string} token - JWT token 字串。
 * @returns {Object|null} - 解析後的 payload 物件或 null。
 */
export const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};