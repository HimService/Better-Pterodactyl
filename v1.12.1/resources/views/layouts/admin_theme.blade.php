<style>
/* 
 * Better Pterodactyl Admin Theme Overrides (Dark Mode)
 * Transforms AdminLTE into a modern SaaS-style dashboard.
 */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #0f172a !important; /* Tailwind Slate-900 */
    color: #e2e8f0 !important; /* Tailwind Slate-200 */
    font-size: 18.25px !important; /* Aggressively increased for maximum accessibility */
}

/* CSS Variables for Blade templates to follow the dark theme if they use them */
:root, body, .dark {
    --bg-main: 15, 23, 42; /* #0f172a */
    --bg-card: 30, 41, 59; /* #1e293b */
    --text-primary: 241, 245, 249; /* #f1f5f9 */
    --text-secondary: 148, 163, 184; /* #94a3b8 */
}

/* Specific AdminLTE fixes */
body, .wrapper, .content-wrapper, .right-side {
    background-color: #0f172a !important;
    color: #e2e8f0 !important;
}

.content-wrapper {
    margin-top: 56px !important; /* Sync with header height */
}

.main-header {
    border-bottom: none !important;
}

.box {
    border-radius: 8px !important;
    border-top: 0 !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3) !important;
    background-color: #1e293b !important;
    margin-bottom: 24px !important;
    border: 1px solid #334155 !important;
    color: #e2e8f0 !important;
    transition: box-shadow 0.3s ease;
}

.box:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3) !important;
}

h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-weight: 600 !important;
    color: #f1f5f9 !important;
}

/* Base Skin Blue Overrides */
.skin-blue .main-header .navbar,
.skin-blue .main-header .logo {
    background-color: #1e293b !important; /* Tailwind Slate-800 to match cards */
    border-bottom: 1px solid #334155 !important;
    background-image: none !important;
    height: 56px !important; /* Slightly thinner for better balance */
    line-height: 56px !important;
    z-index: 1030 !important; /* Ensure it stays above everything but below modals */
}

.main-header .logo {
    display: flex !important;
    align-items: center;
    justify-content: center;
    padding: 0 15px !important;
}

/* Handle collapsed sidebar logo */
@media (min-width: 768px) {
    body.sidebar-collapse .main-header .logo {
        width: 50px !important;
    }
    body.sidebar-collapse .main-header .navbar {
        margin-left: 50px !important;
    }
    body.sidebar-collapse .main-header .logo > .logo-lg {
        display: none !important;
    }
    body.sidebar-collapse .main-header .logo > .logo-mini {
        display: block !important;
    }
}

.skin-blue .main-header .navbar .sidebar-toggle {
    color: #cbd5e1 !important; /* Tailwind Slate-300 */
    padding: 0 20px !important;
    height: 56px !important;
    display: flex !important;
    align-items: center;
    float: left !important; /* Keep it on the left next to the logo */
    font-size: 1.25rem;
    line-height: 56px !important;
    transition: background-color 0.2s ease, color 0.2s ease;
}

.skin-blue .main-header .navbar .sidebar-toggle .icon-bar {
    background-color: #cbd5e1 !important;
}

.skin-blue .main-header .navbar .sidebar-toggle:hover {
    background-color: #334155 !important; /* Tailwind Slate-700 */
    color: #f8fafc !important; /* Tailwind Slate-50 */
}

.skin-blue .main-sidebar {
    background-color: #020617; /* Tailwind Slate-950 */
    box-shadow: 2px 0 10px rgba(0,0,0,0.5);
    padding-top: 56px !important; /* Sync with header height */
}

.skin-blue .wrapper, .skin-blue .main-sidebar, .skin-blue .left-side {
    background-color: #020617;
}

.skin-blue .sidebar-menu > li.header {
    background-color: #020617;
    color: #64748b;
    font-weight: 600;
    font-size: 14.5px;
    letter-spacing: 0.85px;
    padding: 18px 25px 10px 15px !important;
}

/* Sidebar Modifications */
.skin-blue .sidebar-menu > li > a {
    color: #94a3b8 !important;
    border-left: 3px solid transparent;
    transition: all 0.3s ease;
    font-size: 16.5px; /* Scaled sidebar links */
    padding: 15px 15px 15px 20px !important; /* Larger hit area */
}

.skin-blue .sidebar-menu > li:hover > a,
.skin-blue .sidebar-menu > li.active > a {
    color: #f8fafc !important;
    background-color: #0f172a !important;
    border-left-color: #4f46e5;
}

.skin-blue .sidebar a {
    color: #94a3b8;
}
.skin-blue .sidebar a:hover {
    color: #f8fafc;
}

.box-header {
    border-bottom: 1px solid #334155 !important;
    background-color: #1e293b !important;
    color: #e2e8f0 !important;
    padding: 16px 24px !important;
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
}

.box-header.with-border {
    border-bottom: 1px solid #334155 !important;
}

.box-header .box-title {
    font-weight: 600 !important;
    font-size: 1.1rem !important;
    color: #f1f5f9 !important;
    margin: 0 !important;
    display: inline-block;
    line-height: 30px;
}

.box-header .box-tools {
    position: absolute;
    right: 24px;
    top: 16px;
}

.box-body {
    padding: 24px !important;
    background-color: transparent !important;
    color: #e2e8f0 !important;
}

.box-body.no-padding {
    padding: 0 !important;
}

.box-body.no-padding > .table {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}

.box-footer {
    border-top: 1px solid #334155 !important;
    background-color: transparent !important;
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
    padding: 16px 24px !important;
}

/* Fix for Pterodactyl's .box-body.row usage which causes overflow */
.box-body.row {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

/* Footer & Breadcrumb Override */
.main-footer {
    background-color: #0f172a !important;
    border-top: 1px solid #334155 !important;
    color: #94a3b8 !important;
}
.main-footer a {
    color: #818cf8 !important; /* Tailwind Indigo-400 */
    font-weight: 500;
}

/* Text Overrides */
.text-muted {
    color: #94a3b8 !important;
}

/* Modern Inputs */
.form-control, .form-control[disabled], .form-control[readonly] {
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    padding: 10px 14px;
    height: auto;
    background-color: rgba(0, 0, 0, 0.4) !important;
    color: #f1f5f9 !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2) !important;
    transition: all 0.3s ease;
}

.form-control:focus {
    border-color: #818cf8 !important; /* Tailwind Indigo-400 */
    background-color: rgba(0, 0, 0, 0.6) !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(129, 140, 248, 0.2) !important;
    outline: none !important;
}

/* File Inputs */
input[type="file"].form-control {
    padding: 6px 14px;
}

input[type="file"]::file-selector-button {
    background-color: #334155;
    color: #f8fafc;
    border: 1px solid #475569;
    border-radius: 6px;
    padding: 4px 12px;
    margin-right: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

input[type="file"]::file-selector-button:hover {
    background-color: #475569;
    border-color: #64748b;
}

select.form-control, select.form-control:focus {
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1.2em 1.2em;
    padding-right: 2.5rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

/* Label & Badges */
.label {
    border-radius: 6px;
    padding: 4px 8px;
    font-weight: 600;
    font-size: 0.75rem;
    color: #ffffff !important;
}

.label-success { background-color: #10b981 !important; }
.label-danger { background-color: #ef4444 !important; }
.label-warning { background-color: #f59e0b !important; }
.label-primary { background-color: #4f46e5 !important; }
.label-info { background-color: #3b82f6 !important; }
.label-default { background-color: #475569 !important; }

/* Table Overrides */
.table > thead > tr > th {
    border-bottom: 1px solid #334155 !important;
    color: #94a3b8 !important;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
}

.table > tbody > tr > td {
    border-top: 1px dashed #334155 !important;
    vertical-align: middle;
    color: #f1f5f9 !important;
}

/* Smooth row hover transitions */
.table > tbody > tr {
    transition: background-color 0.15s ease, color 0.15s ease;
}

/* Align first and last columns with the box padding */
.table > thead > tr > th:first-child,
.table > tbody > tr > td:first-child {
    padding-left: 24px !important;
}

.table > thead > tr > th:last-child,
.table > tbody > tr > td:last-child {
    padding-right: 24px !important;
}

.table > tbody > tr > td:first-child {
    color: #94a3b8 !important;
}

/* Specific fix for ping column in tables (e.g. Nodes list) */
.table > tbody > tr > td.left-icon {
    width: 60px;
    text-align: center;
}

.box-body a {
    color: #818cf8;
    font-weight: 500;
    transition: color 0.2s ease;
}

.box-body a:hover {
    color: #a5b4fc;
}

.table > tbody > tr:hover {
    background-color: #334155 !important;
    color: #f8fafc !important;
}

.table-hover > tbody > tr:hover {
    background-color: #334155 !important;
}

/* Alerts & Callouts */
.alert {
    border-radius: 8px;
    border: 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.callout {
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    border-left-width: 4px;
    background-color: #1e293b !important;
    border-color: #334155 !important;
    color: #e2e8f0 !important;
}

/* Info Boxes (Dashboard Stat Cards) */
.info-box {
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
    border: 1px solid #334155;
    background: #1e293b;
    color: #e2e8f0;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.info-box:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
}

.info-box-icon {
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
}

.info-box-content {
    color: #e2e8f0;
}

.info-box-text {
    color: #94a3b8 !important;
}
.info-box-number {
    color: #f1f5f9 !important;
}

/* Small Boxes (Dashboard Stat Cards) */
.small-box {
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
    border: 1px solid #334155;
    background-color: #1e293b !important;
    color: #e2e8f0 !important;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
    overflow: hidden;
    position: relative;
    display: block;
    margin-bottom: 24px;
}
.small-box:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
}
.small-box > .inner {
    padding: 24px;
}
.small-box > .inner > h3 {
    margin: 0 0 4px 0;
    font-size: 1.5rem;
    font-weight: 700 !important;
    color: #f8fafc !important;
}
.small-box > .inner > p {
    font-size: 0.8rem;
    color: #94a3b8 !important;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}
.small-box .icon {
    transition: all 0.3s ease;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 20px;
    z-index: 0;
    font-size: 56px;
    color: rgba(255, 255, 255, 0.03) !important;
}
.small-box:hover .icon {
    font-size: 60px;
    color: rgba(255, 255, 255, 0.06) !important;
}
.small-box > .small-box-footer {
    position: relative;
    text-align: center;
    padding: 12px 0;
    color: #94a3b8 !important;
    display: block;
    z-index: 10;
    background: rgba(0,0,0,0.15) !important;
    text-decoration: none;
    border-top: 1px solid #334155;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
}
.small-box > .small-box-footer:hover {
    color: #f1f5f9 !important;
    background: rgba(0,0,0,0.25) !important;
}

/* Base background colors for small box if they are forced */
.small-box.bg-gray {
    background-color: #1e293b !important;
}
.small-box.bg-blue {
    background-color: #3b82f6 !important;
}
.small-box.bg-yellow {
    background-color: #f59e0b !important;
}
.small-box.bg-maroon {
    background-color: #9f1239 !important;
}

/* Pagination */
.pagination > li > a, .pagination > li > span {
    color: #818cf8;
    background-color: #1e293b;
    border: 1px solid #334155;
}

.pagination > li:first-child > a, .pagination > li:first-child > span {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
}

.pagination > li:last-child > a, .pagination > li:last-child > span {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
}

.pagination > .active > a, .pagination > .active > a:focus, .pagination > .active > a:hover, 
.pagination > .active > span, .pagination > .active > span:focus, .pagination > .active > span:hover {
    background-color: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
}

.pagination > li > a:hover {
    background-color: #334155;
    color: #a5b4fc;
}

.pagination > .disabled > a, .pagination > .disabled > a:focus, .pagination > .disabled > a:hover, .pagination > .disabled > span, .pagination > .disabled > span:focus, .pagination > .disabled > span:hover {
    color: #64748b;
    background-color: #0f172a;
    border-color: #334155;
}

/* Modals - Ultra Premium SaaS Styling */
.modal-content {
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    background-color: rgba(15, 23, 42, 0.85); /* Deep Slate-900 with transparency */
    backdrop-filter: blur(24px); /* Heavy Glassmorphism */
    -webkit-backdrop-filter: blur(24px);
    color: #e2e8f0;
    overflow: hidden;
}

.modal-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Very subtle line */
    padding: 24px 32px;
    background: transparent;
}

.modal-title {
    font-weight: 700;
    color: #f8fafc;
    font-size: 1.5rem;
    letter-spacing: -0.025em;
}

.modal-body {
    padding: 32px;
    background: transparent;
}

.modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 24px 32px;
    background: rgba(0, 0, 0, 0.2); /* Slightly darker footer to ground it */
}

button.close {
    color: #94a3b8;
    opacity: 0.8;
    text-shadow: none;
    font-size: 1.5rem;
    transition: color 0.2s ease;
}

button.close:hover {
    color: #f1f5f9;
    opacity: 1;
}

/* SweetAlert Overrides */
.sweet-alert {
    background-color: #1e293b !important;
    border-radius: 12px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    border: 1px solid #334155 !important;
}

.sweet-alert h2 {
    color: #f8fafc !important;
}

.sweet-alert p {
    color: #cbd5e1 !important;
    font-weight: 500 !important;
}

.sweet-alert .sa-icon.sa-warning {
    border-color: #f59e0b !important;
}
.sweet-alert .sa-icon.sa-warning .sa-body, 
.sweet-alert .sa-icon.sa-warning .sa-dot {
    background-color: #f59e0b !important;
}

.sweet-alert .sa-icon.sa-success {
    border-color: #10b981 !important;
}
.sweet-alert .sa-icon.sa-success::before, 
.sweet-alert .sa-icon.sa-success::after,
.sweet-alert .sa-icon.sa-success .sa-fix {
    background-color: transparent !important;
}
.sweet-alert .sa-icon.sa-success .sa-line {
    background-color: #10b981 !important;
}

.sweet-alert .sa-icon.sa-error {
    border-color: #ef4444 !important;
}
.sweet-alert .sa-icon.sa-error .sa-line {
    background-color: #ef4444 !important;
}

.sweet-alert .sa-icon.sa-info {
    border-color: #3b82f6 !important;
}
.sweet-alert .sa-icon.sa-info::before, 
.sweet-alert .sa-icon.sa-info::after {
    background-color: #3b82f6 !important;
}

.sweet-alert button.cancel {
    background-color: #334155 !important;
    color: #e2e8f0 !important;
}
.sweet-alert button.cancel:hover {
    background-color: #475569 !important;
    color: #f8fafc !important;
}
.sweet-alert button {
    border-radius: 8px !important;
    font-weight: 500 !important;
    padding: 10px 24px !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3) !important;
}
.sweet-alert button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
}
.sweet-alert button:active {
    transform: scale(0.96) !important;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2) !important;
}

/* Content Header / Breadcrumb */
.content-header > h1 {
    font-weight: 800 !important;
    font-size: 2rem !important;
    color: #f1f5f9 !important;
    letter-spacing: -0.02em;
    margin-bottom: 8px !important;
}

.content-header > h1 > small {
    color: #94a3b8 !important;
    font-weight: 500 !important;
}

.breadcrumb {
    background: transparent !important;
    padding: 0 !important;
    margin-bottom: 0 !important;
}

.breadcrumb > li > a {
    color: #818cf8 !important;
    font-weight: 500 !important;
}

.breadcrumb > li {
    color: #94a3b8 !important;
}

.breadcrumb > .active {
    color: #cbd5e1 !important;
}

/* Code Blocks inside AdminLTE */
code {
    background-color: #334155 !important;
    color: #cbd5e1 !important;
    border-radius: 6px !important;
    padding: 3px 6px !important;
    font-size: 0.85em;
    font-weight: 500;
    border: 1px solid #475569;
}

/* Nav Tabs & Settings Tabs */
.nav-tabs-custom {
    background: #1e293b !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3) !important;
    border-radius: 8px !important;
    margin-bottom: 24px !important;
    border: 1px solid #334155 !important;
}

.nav-tabs-custom > .nav-tabs {
    border-bottom: 1px solid #334155 !important;
    margin: 0 !important;
    border-top-right-radius: 8px !important;
    border-top-left-radius: 8px !important;
    background-color: transparent !important;
}

.nav-tabs-custom > .nav-tabs > li {
    border-top: 3px solid transparent !important;
    margin-bottom: -1px !important;
    margin-right: 0 !important;
}

.nav-tabs-custom > .nav-tabs > li.active {
    border-top-color: #4f46e5 !important;
}

.nav-tabs-custom > .nav-tabs > li > a {
    color: #94a3b8 !important;
    font-weight: 500 !important;
    border-radius: 0 !important;
    padding: 12px 20px !important;
    background: transparent !important;
    border: none !important;
}

.nav-tabs-custom > .nav-tabs > li.active > a,
.nav-tabs-custom > .nav-tabs > li.active:hover > a {
    color: #818cf8 !important;
    background-color: #1e293b !important;
    border-right: 1px solid #334155 !important;
    border-left: 1px solid #334155 !important;
}

.nav-tabs-custom > .nav-tabs > li > a:hover {
    color: #f1f5f9 !important;
}

.nav-tabs-custom > .tab-content {
    background: #1e293b !important;
    padding: 24px !important;
    border-bottom-right-radius: 8px !important;
    border-bottom-left-radius: 8px !important;
    color: #e2e8f0 !important;
}

/* Button Fixes - Tactile & Premium */
.btn {
    border-radius: 10px;
    font-weight: 600;
    padding: 10px 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    color: #ffffff;
    letter-spacing: 0.025em;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn:active {
    transform: scale(0.97) !important;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2) !important;
}

.btn.btn-sm {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
}

.btn-primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-color: #4f46e5;
    box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39);
}
.btn-primary:hover, .btn-primary:focus, .btn-primary:active, .btn-primary.active {
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
}

.btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: #059669;
    box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);
}
.btn-success:hover, .btn-success:focus, .btn-success:active, .btn-success.active {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-color: #dc2626;
    box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.39);
}
.btn-danger:hover, .btn-danger:focus, .btn-danger:active, .btn-danger.active {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
}

.btn-warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-color: #d97706;
    box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.39);
}
.btn-warning:hover, .btn-warning:focus, .btn-warning:active, .btn-warning.active {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.btn-info {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-color: #2563eb;
    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
}
.btn-info:hover, .btn-info:focus, .btn-info:active, .btn-info.active {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.btn-default {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0 !important;
}
.btn-default:hover, .btn-default:focus, .btn-default:active, .btn-default.active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff !important;
}

/* Select2 / Tags input */
.select2-container .select2-selection--single {
    height: 42px !important;
    padding: 6px 12px !important;
    display: flex;
    align-items: center;
}

.select2-container--default .select2-selection--single .select2-selection__arrow {
    height: 40px !important;
    right: 10px !important;
}

.select2-container--default .select2-selection--single, .select2-container--default .select2-selection--multiple {
    background-color: #0f172a !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    color: #f1f5f9;
}
.select2-container--default .select2-selection--single .select2-selection__rendered {
    color: #f1f5f9 !important;
    padding-left: 0 !important;
}
.select2-dropdown {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
}
.select2-container--default .select2-results__option[aria-selected=true] {
    background-color: #334155;
}
.select2-container--default .select2-results__option--highlighted[aria-selected] {
    background-color: #4f46e5;
}
.select2-search--dropdown .select2-search__field {
    background-color: #0f172a;
    color: #f1f5f9;
    border: 1px solid #334155;
}

/* DataTables overloads if they appear */
div.dataTables_wrapper div.dataTables_filter input {
    background-color: #0f172a;
    border: 1px solid #334155;
    color: #f1f5f9;
    border-radius: 6px;
    padding: 4px 8px;
}
div.dataTables_wrapper div.dataTables_length select {
    background-color: #0f172a;
    border: 1px solid #334155;
    color: #f1f5f9;
    border-radius: 6px;
}
table.dataTable.no-footer {
    border-bottom: 1px solid #334155;
}

</style>
