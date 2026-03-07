# Better Pterodactyl 插件開發文檔 (SDK v1.0)

本文件將引導你如何開發並在 Better Pterodactyl 面板中部署自定義小工具（Plugins）。

---

## 1. 插件基礎結構 (JSON)

插件是以單個 `.json` 檔案或代碼塊的形式存在的。基本結構如下：

```json
{
  "name": "插件名稱",
  "description": "功能描述",
  "slot": "插槽位置 (sidebar | dashboard_header)",
  "type": "類型 (iframe | custom_html)",
  "config": {
    "url": "如果是 iframe，輸入網址",
    "html": "如果是 custom_html，輸入 HTML 代碼",
    "height": "高度 (例如 150px，僅用於 header)",
    "variables": {
      "text_color": { "value": "#ffffff", "label": "文字顏色" },
      "announcement": { "value": "歡迎來到面板！", "label": "公告內容" }
    }
  }
}
```

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

---

## 3. 插件類型說明

### A. Iframe 模式
最簡單的開發方式，你可以將任何網頁（包含天氣、匯率圖表）掛載到面板。
- **優點**: 隔離性好。
- **缺點**: 無法直接讀取面板數據，受限於 X-Frame-Options。

### B. Custom HTML 模式 (推薦)
直接注入 HTML/CSS 到面板中。這讓你的小工具看起來像面板「原生的」。
- **提示**: 你可以在 `<style>` 標籤中使用面板內建的 CSS 變數：
  - `--brand-main`: 面板主題色（通常是紫色/藍色）。
  - `--text-primary`: 主要文字顏色。
  - `--bg-app`: 應用背景色。

---

## 4. 實戰範例：原生感數據小卡 (Dashboard Header)

這是一個能完美融入面板 UI 的數據小卡範例：

```json
{
  "name": "系統公告卡片",
  "slot": "dashboard_header",
  "type": "custom_html",
  "config": {
    "html": "<div style='background: rgba(31, 41, 55, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px; border-radius: 12px; backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between;'><div style='display: flex; align-items: center; gap: 12px;'><div style='width: 40px; height: 40px; background: var(--brand-main); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;'>🔔</div><div><div style='font-size: 14px; color: #9ca3af; font-weight: bold;'>系統通知</div><div style='font-size: 16px; color: white;'>今日伺服器維護已提前完成！</div></div></div><button style='background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer;' onmouseover='this.style.background=\"rgba(255,255,255,0.2)\"' onmouseout='this.style.background=\"rgba(255,255,255,0.1)\"'>我知道了</button></div>"
  }
}
```

---

## 5. API 呼叫 (進階交互)

當使用 `custom_html` 類型時，你可以利用瀏覽器原生的 `fetch` 來調用面板內建的 API。

### 範例：獲取當前帳號信箱
注意：獲取帳號資訊的正確 API 路徑是 `/api/client/account`。

```json
{
  "name": "API 測試器",
  "slot": "dashboard_header",
  "type": "custom_html",
  "config": {
    "html": "<div id='api-status' style='padding:10px; background:rgba(0,0,0,0.3); border-radius:8px;'>正在獲取數據...</div><script>(function(){ fetch('/api/client/account').then(res => res.json()).then(data => { document.getElementById('api-status').innerHTML = '歡迎回來，' + data.attributes.email; }).catch(err => { document.getElementById('api-status').innerHTML = '獲取數據失敗'; }); })();</script>"
  }
}
```

---

## 6. 自定義彈窗介面 (Modal UI)

面板已經內嵌了 `SweetAlert2` (swal)，你可以直接調用它。

**重要提示**: 為了確保 `onclick` 事件能找到你的函數，請將函數掛載到 `window` 對象上。

### 範例：點擊 Icon 開啟設定彈窗 (Sidebar)
```json
{
  "name": "快捷設定",
  "slot": "sidebar",
  "type": "custom_html",
  "config": {
    "html": "<div onclick='window.showPluginSettings()' style='cursor:pointer; width:48px; height:48px; display:flex; align-items:center; justify-content:center; background:rgba(var(--brand-main-rgb), 0.1); border-radius:12px; color:var(--brand-main);'><svg width='24' height='24' fill='none' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24'><path d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'></path><circle cx='12' cy='12' r='3'></circle></svg></div><script>window.showPluginSettings = function(){ Swal.fire({ title: '插件自定義彈窗', html: '<div style=\"text-align:left; color:#9ca3af;\">這是一個由插件觸發的原生彈窗。你可以在這裡放置：<ul style=\"margin-top:10px;\"><li>自定義表單</li><li>通知訊息</li><li>外部控制按鈕</li></ul></div>', background: 'rgba(23, 23, 23, 0.95)', color: '#fff', confirmButtonColor: '#8b5cf6', backdrop: 'rgba(0,0,0,0.5)' }); }</script>"
  }
}
```

---

## 7. 變數系統 (Variables)

變數系統允許你在不修改原始碼的情況下，透過後台 UI 調整插件參數。

### 定義變數
在 `config` 對象中新增 `variables` 欄位：
- `value`: 預設值。
- `label`: 在後台顯示的名稱。

### 使用變數 (HTML)
在 `html` 欄位中，使用 `{{變數名稱}}` 語法：
```html
<div style="color: {{text_color}}">{{announcement}}</div>
```

### 使用變數 (Javascript)
變數會自動注入到全域 `window.BP_VARIABLES` 對象中：
```javascript
console.log(window.BP_VARIABLES.text_color);
```

---

---

## 8. 自定義頁面路由 (Custom Page Routing)

如果你需要開發一個大型工具（例如完整的備份管理介面、伺服器監控面板），可以使用自定義路由功能來獲得全螢幕的開發空間。

### 如何使用
在 `config` 對象中新增 `route` 欄位。

### 範例：開發一個獨立的全螢幕頁面
```json
{
  "name": "獨立工作台",
  "slot": "sidebar",
  "type": "custom_html",
  "config": {
    "route": "my-workspace",
    "html": "<h3>這是我的全螢幕插件頁面</h3><p>你可以在這裡自由發揮！</p>"
  }
}
```

### 存取路徑
當你設定了 `route: "my-workspace"`，該插件會自動註冊到：
`https://你的面板網址/plugins/my-workspace`

> [!TIP]
> 建議在 `sidebar` 插槽放置一個帶有連結的 Icon，讓用戶點擊後跳轉到你的插件頁面：
> `<a href="/plugins/my-workspace">開啟工具箱</a>`

### 啟動器與頁面分離 (Launcher vs Page)
為了避免側邊欄被全螢幕頁面的 HTML 撐破，當插件設定了 `route` 時，系統在插槽中會優先尋找 `launcher_html`。

- 如果有 `launcher_html`：在插槽中顯示此內容。
- 如果沒有 `launcher_html`：在插槽中顯示預設的「拼圖圖示」按鈕。
- `html`：永遠作為 `/plugins/:route` 頁面的主內容。

#### 範例：自定義側邊欄圖示
```json
{
  "name": "伺服器工具箱",
  "slot": "sidebar",
  "type": "custom_html",
  "config": {
    "route": "server-toolbox",
    "launcher_html": "<a href='/plugins/{{route}}' style='display:flex; justify-content:center;' title='開啟工具箱'><div style='width:40px;height:40px;background:var(--brand-main);border-radius:10px;display:flex;align-items:center;justify-content:center;'>🛠️</div></a>",
    "html": "<h3>這是完整的工具箱頁面...</h3>"
  }
}
```

---

## 9. 最佳實踐建議

1. **命名空間**: 為了避免 JS 衝突，請務必將代碼包裹在 `(function(){ ... })()` 中，或使用不重複的函數名稱。
2. **顏色引用**: 優先使用 `var(--brand-main)` 確保插件顏色會跟隨面板主題色（Theme）自動切換。
3. **安全性**: 不要載入不受信任的原始碼，因為插件具備與當前登入用戶相同的權限。
