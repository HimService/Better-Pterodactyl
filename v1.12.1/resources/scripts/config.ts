/**
 * Better Pterodactyl - Frontend Configuration
 * 
 * You can customize various aspects of the frontend interface here.
 */
const config = {
    /**
     * The language used for the login page and other authentication views
     * before a user is logged in.
     * 
     * Options: 'zh', 'en', 'ja'
     */
    login_language: 'en',

    /**
     * Fallback language if the primary language detection fails.
     */
    fallback_language: 'en',

    /**
     * Theme Customization
     */
    theme: {
        /**
         * The primary accent color for the theme.
         * Default: #8b5cf6 (Indigo 500)
         */
        primary_color: '#8b5cf6',
    },

    /**
     * Login Page Visual Experience
     * 
     * You can customize the background and effects of the login page.
     */
    login_visuals: {
        /**
         * The type of background to display.
         * Options: 'none', 'particles', 'video'
         */
        background_type: 'video',

        /**
         * The URL for the video background (if background_type is 'video').
         * Can be a local path (static asset) or an external link.
         */
        video_url: '/assets/background.mp4',

        /**
         * Whether to enable glowing animated borders for the login form.
         */
        glow_borders: false,
    },
};

export default config;
