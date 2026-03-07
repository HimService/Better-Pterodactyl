# Better Pterodactyl 插件開發文檔 (SDK v1.2)

本文件將引導你如何開發並在 Better Pterodactyl 面板中部署自定義小工具（Plugins）。

---

## 1. 插件基礎結構 (JSON)

插件是以單個 `.json` 檔案或代碼塊的形式存在的。基本結構如下：

```json
{
  "name": "插件名稱",
  "description": "功能描述",
  "slot": "sidebar",
  "type": "custom_html",
  "config": {
    "permissions": ["api:get", "storage", "events"],
    "url": "如果是 iframe，輸入網址",
    "html": "如果是 custom_html，輸入 HTML 代碼",
    "height": "高度 (例如 150px)",
    "variables": {
      "text_color": { "value": "#ffffff", "label": "文字顏色" }
    },
    "backend_hooks": {
      "get_stats": {
        "type": "php",
        "code": "return ['server_count' => \\Pterodactyl\\Models\\User::count()];"
      }
    }
  }
}
```

> [!IMPORTANT]
> **權限系統 (Permissions)**: 為了安全性，插件必須在 `config.permissions` 中宣告需要的權限。未宣告的功能將無法調用。
> - `api:get`: 允許調用 `BP.api.get`
> - `api:post`: 允許調用 `BP.api.post`
> - `storage`: 允許調用 `BP.storage` 及其子功能 (現在預設為**用戶級別**隔離)
> - `events`: 允許使用 `BP.on` 與 `BP.emit` 進行跨插件通訊
> - `*`: 允許所有權限 (不建議)

---

## 2. 插槽 (Slots) 說明

| 插槽 ID | 顯示位置 | 建議類型 | 備註 |
| :--- | :--- | :--- | :--- |
| `sidebar` | 側邊欄導航列 (中段) | `custom_html` | 會自動限制為 **48x48** 的 Icon 大小。 |
| `sidebar_bottom` | 側邊欄導航列 (最底) | `custom_html` | 適合放置版權資訊或額外導航 Icon。 |
| `dashboard_header` | 儀表板正上方 | `custom_html` | 寬度 100%，適合放公告橫幅或數據統計。 |
| `dashboard_footer` | 儀表板最下方 | `custom_html` | 適合放頁尾連結或統計訊息。 |
| `server_header` | 伺服器管理頁正上方 | `custom_html` | 進入特定伺服器後顯示，適合放伺服器狀態。 |
| `server_footer` | 伺服器管理頁最下方 | `custom_html` | 適合放伺服器相關的幫助鏈接。 |
| `login_top` | 登入框上方 | `custom_html` | 適合放置 Logo 或登入說明。 |
| `login_bottom` | 登入框下方 | `custom_html` | 適合放置註冊鏈接或社交媒體按鈕。 |
| `navbar_end` | 頂部導航欄右側 | `custom_html` | 適合放置主題切換以外的小工具。 |
| `api` | 無 (純後端) | `none` | 專門用於自定義 API 端點，不佔用任何 UI 空間。 |

---

## 3. 插件類型說明

### A. Iframe 模式
最簡單的開發方式，你可以將任何網頁（包含天氣、匯率圖表）掛載到面板。
- **優點**: 隔離性好。
- **缺點**: 無法直接讀取面板數據，受限於 X-Frame-Options。

### B. Custom HTML 模式 (推薦)
直接注入 HTML/CSS 到面板中。這讓你的小工具看起來像面板「原生的」。
- **Shadow DOM 隔離**: 每個插件運行在獨立的 Shadow DOM 中。
  - **樣式繼承 (v1.1)**: 系統會自動將 `--brand-main` 等核心主題變數注入到 Shadow DOM 中，確保插件風格與面板一致。
  - **CSS 起點重置**: 系統對 `:host` 使用 `all: initial`。
- **HTML 清洗**: 系統內建 `DOMPurify` 自動過濾 XSS 代碼。

---

## 4. 核心 SDK (Plugin SDK - `window.BP`)

SDK v1.1 引入了更多開發者友善的功能。

### A. 作用域隔離 (Scoped Injection)
當腳本執行時，會自動傳入 `BP`, `BP_VARIABLES` 與 `root` 對象。

```javascript
/* 推薦的腳本格式 */
(function(BP, BP_VARIABLES, root) {
    BP.log('info', '插件已初始化');
})(BP, BP_VARIABLES, root);
```

### B. 事件系統 (Event System)
允許插件之間或與系統進行異步通訊。
```javascript
// 監聽事件
BP.on('theme:change', (data) => {
    BP.log('info', '主題已切換:', data);
});

// 觸發事件
BP.emit('my-plugin:ready', { version: '1.1' });
```

### C. UI 助手 (UI Helpers)
快速建立符合面板風格的交互介面。
```javascript
// 顯示模態框
BP.ui.modal('關於插件', '<p>這是由 BP SDK 產生的模態框。</p>');

// 顯示確認框
const confirmed = await BP.ui.confirm('確定要執行嗎？', '這將會刪除所有本地緩存。');
if (confirmed) {
    BP.notify('success', '已清理');
}
```

### D. 開發者控制台 (Developer Console)
使用 `BP.log` 可以將日誌輸出到管理後台的「開發者控制台」，方便線上調試。
```javascript
BP.log('error', 'API 呼叫失敗', error);
```

### E. 後端 Hook 系統 (Backend Hook System - v1.2)
SDK v1.2 引入了後端擴展能力，允許插件通過面板後端執行 PHP 邏輯。

#### 1. 基本 Hook (透過 SDK 呼叫)
```javascript
BP.api.hook('get_stats').then(res => ...);
```

#### 2. 自定義乾淨路由 (Clean API Routes)
你可以定義對外公開的 API 路徑，不依賴插件 ID，且**選配**身分驗證。
```json
{
  "config": {
    "custom_routes": {
      "public/info": "get_info"
    },
    "backend_hooks": {
      "get_info": {
        "type": "php",
        "code": "return ['msg' => 'Public Data', 'user' => $user ? $user->username : 'Guest'];"
      }
    }
  }
}
```
**請求網址：**
- 全域：`/api/client/extensions/public/info`
- 伺服器：`/api/client/servers/{uuid}/extensions/public/info`

> [!TIP]
> **免登入存取**: 這些路徑預設**不需要**面板的 `Authorization: Bearer` 金鑰。這讓你可以建立完全公開的端點，或者僅使用你自定義的 `X-Plugin-Token` 進行驗證。

> [!IMPORTANT]
> **傳參方式**: 所有發送到這些路由的數據 (Query String 或 POST JSON) 都會被封裝在 PHP 的 `$payload` 變數中。

#### 3. 安全性與自定義 Key (Custom Auth)
預設情況下，API 請求需要 Pterodactyl 的 Client API Key。但你可以建立自己的 Token 驗證：
1. 在 `variables` 裡定義一個 `security_token`。
2. 系統會自動檢查 Header `X-Plugin-Token` 是否與該變數值相符。

```json
{
  "config": {
    "variables": {
      "security_token": { "value": "my-secret-key-123", "label": "API 密鑰" }
    },
    "custom_routes": { "api/test": "my_hook" }
  }
}
```
**請求範例：**
`curl -H "X-Plugin-Token: my-secret-key-123" ...`

> [!TIP]
> 在 PHP `code` 中，你可以透過 `$variables['security_token']['value']` 拿到這個值。

### F. 持久化存儲 (Storage API - 用戶級別)
v1.1 起，存儲預設會帶入 `user_id`。這意味著**不同用戶看到的插件設定是獨立的**。
```javascript
// 儲存用戶偏好
await BP.storage.set('theme', 'dark');

// 讀取目前用戶的偏好
const theme = await BP.storage.get('theme');
```

---

## 5. 生命週期鉤子 (Lifecycle Hooks)

你可以定義全域函數來處理插件的加載與卸載。

```javascript
// 當插件成功掛載並注入 SDK 後觸發
window.onPluginLoaded = function(variables) {
    console.log('Plugin Loaded!');
};

// 當插件被移除 (例如頁面切換) 時觸發，用於清理計時器或事件
window.onPluginUnmount = function() {
    console.log('Cleaning up...');
};
```

---

## 6. 最佳實踐與開發建議

1.  **清理事件**: 雖然系統會自動取消 `BP.on` 註冊的事件，但如果你使用了 `setInterval`，請務必在 `onPluginUnmount` 中清除它。
2.  **安全性**: 盡量不要在 `permissions` 中使用 `*`。
3.  **異步操作**: 所有的 `BP.api` 與 `BP.storage` 都是返回 Promise，請使用 `await` 或 `.then()`。
4.  **調試**: 多利用 `BP.log` 並在管理後台的「插件管理」頁面查看結果。
