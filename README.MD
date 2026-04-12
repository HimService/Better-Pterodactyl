# Better Pterodactyl - 翼手龍面板前端優化與功能增強項目

Better Pterodactyl 是一個專注於 Pterodactyl 面板前端介面優化與後端功能增強的開源項目。旨在不影響原始後端邏輯/資料庫的前提下，透過重構組件樣式、優化交互流程並整合多項進階功能，提供使用者與系統管理員更現代、直觀且專業的操作體驗。

> [!CAUTION]
> 本項目目前處於開發測試階段，所以我們不允許任何人進行二次開發調適本項目，以避免不必要的麻煩。

---

## 核心亮點 (Core Highlights)

### 1. 介面設計語言 (Premium UI/UX)
- **現代化設計**: 採用現代風格，結合層次化的邊框與陰影，打造全新質感。
- **動態視覺反饋**: 全局引入細微的過渡動畫、Pulse（脈衝）特效與微交互，讓介面充滿靈魂。
- **優化排版**: 針對導航欄、側邊欄及資訊卡片進行深度重構，極大提升資訊密度與閱讀效率。
- **主題切換**: 原生支持深色/淺色/系統同步多種主題模式。

### 2. 整合式功能模組 (Feature Integration)
- **經濟系統 (Economy System)**: 
    - 內建資源商店，允許使用者購買 CPU、RAM、Disk、備份及分配額度。
    - 獨立的點數（Points）系統，支持透過 API 或管理端進行調整。
    - 完整的事務日誌（Transaction logs）與計費周期支持。
- **Discord 整合**: 
    - 支持 Discord OAuth2 快速登入。
    - 自動連結 Discord 帳號，並可設定是否開放註冊。
- **公開狀態頁面 (Public Status Page)**: 
    - 獨立且精美的狀態頁面，即時顯示各節點（Nodes）的運作狀態。
    - 詳細的硬體監控：CPU 核心、記憶體、硬碟使用率及網路頻寬（RX/TX）。
    - 整合 Discord Webhook，當節點斷線或恢復時自動發送通知。
- **管理與限制**: 
    - **特定節點部署 (Allowed Nodes)**: 管理員可限制特定伺服器僅能在指定的節點上運行。
    - **進階插件系統 (Advanced Plugin System)**: 
        - 支持動態配置 GUI，管理員可透過 UI 調整插件參數。
        - 支援 `path_patterns` 與 `permissions` 過濾，實現精確顯示控制。
        - 預置多個注入點：Admin Sidebar, Server Header/Sidebar 等。
    - 強化版管理介面，直觀控制各項擴充功能。

### 3. 翻譯支持 (Localization)
- **繁體中文 (zh-TW)**: 深度優化翻譯，修正原版生硬術語，符合習慣用法。
- **多語系架構**: 完整支持 `i18next`，目前包含繁體中文(`zh`)、英文 (`en`) 與日文 (`ja`)。
- **登入頁預設語系**: 可透過設定檔自定義登入前的預設語言。

---

## 安裝與部署 (Installation)

> [!CAUTION]
> 本項目目前處於開發階段，替換前請務必備份原始文件。

### 1. 環境要求
- Pterodactyl 面板版本: `v1.12.1`
- PHP 擴充功能: `pdo_sqlite` (用於經濟系統與 Discord 整合)
    - Ubuntu/Debian: `apt install php-sqlite3`
    - CentOS/RHEL: `yum install php-sqlite3`
- 已安裝 `yarn` 或 `npm`
- 基本的 Linux 終端操作能力

### 2. 安裝流程
1. 下載本專案對應版本的原始碼。
2. 將 `resources` 資料夾覆蓋至您的 Pterodactyl 根目錄。
3. 如果使用了擴充路由（如 Economy/Discord），請確保將 `routes/*.php` 文件也一併放置到位。
4. 在面板目錄下執行編譯指令：
   ```bash
   yarn build:production
   ```
5. 給予權限:
   ```bash
   sudo chown -R www-data:www-data /var/www/pterodactyl
   ```
6. 清除 Laravel 快取：
   ```bash
   php artisan view:clear && php artisan config:clear
   ```

---

## 設定指南 (Configuration)

### 調整預設語言
編輯專用設定檔：`resources/scripts/config.ts`
```typescript
const config = {
    login_language: 'zh', // 可選: 'zh', 'en', 'ja'
    // ...
};
```

### 功能開關
大部分功能（如經濟系統、Discord 登入）可透過管理員後台控制對應設定頁面進行開啟或關閉。

---

## 支持版本
- **推薦版本**: Pterodactyl `v1.12.1` (穩定維護中)
- **舊版支持**: `v1.11.7` (已停止功能更新，且系統及不穩定)

---

## 相關鏈接
- **GitHub Repository**: [HimService/Better-Pterodactyl](https://github.com/HimService/Better-Pterodactyl)
- **開發者**: [HimService](https://github.com/HimService)
