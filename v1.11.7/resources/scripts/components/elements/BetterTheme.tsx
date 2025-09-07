import { createGlobalStyle } from 'styled-components';

const BetterTheme = createGlobalStyle`
    :root {
        --color-background-light: #f8f9fa;
        --color-text-light: #495057;
        --color-heading-light: #212529;
        --color-primary-light: #5e72e4;
        --color-primary-hover-light: #4a5cc0;
        --color-card-bg-light: #ffffff;
        --color-card-border-light: #e9ecef;
        --color-shadow-light: rgba(0, 0, 0, 0.05);
        --color-muted-light: #868e96;

        --color-background-dark: #171923;
        --color-text-dark: #a0aec0;
        --color-heading-dark: #e2e8f0;
        --color-primary-dark: #7f5af0;
        --color-primary-hover-dark: #6a48d0;
        --color-card-bg-dark: #1a202c;
        --color-card-border-dark: #2d3748;
        --color-shadow-dark: rgba(0, 0, 0, 0.2);
        --color-muted-dark: #718096;
    }

    body[data-theme="light"] {
        --color-background: var(--color-background-light);
        --color-text: var(--color-text-light);
        --color-heading: var(--color-heading-light);
        --color-primary: var(--color-primary-light);
        --color-primary-hover: var(--color-primary-hover-light);
        --color-card-bg: var(--color-card-bg-light);
        --color-card-border: var(--color-card-border-light);
        --color-shadow: var(--color-shadow-light);
        --color-muted: var(--color-muted-light);
    }

    body[data-theme="dark"] {
        --color-background: var(--color-background-dark);
        --color-text: var(--color-text-dark);
        --color-heading: var(--color-heading-dark);
        --color-primary: var(--color-primary-dark);
        --color-primary-hover: var(--color-primary-hover-dark);
        --color-card-bg: var(--color-card-bg-dark);
        --color-card-border: var(--color-card-border-dark);
        --color-shadow: var(--color-shadow-dark);
        --color-muted: var(--color-muted-dark);
    }

    body {
        background-color: var(--color-background) !important;
        color: var(--color-text) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    }

    h1, h2, h3, h4, h5, h6 {
        color: var(--color-heading) !important;
    }
`;

export default BetterTheme;