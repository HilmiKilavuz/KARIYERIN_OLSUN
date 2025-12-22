// Professional Frontend Logger
// Only log in development, silent in production

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
    info: (message: string, data?: any) => {
        if (!isDev) return;
        console.log(`ℹ️ ${message}`, data || '');
    },

    success: (message: string, data?: any) => {
        if (!isDev) return;
        console.log(`✅ ${message}`, data || '');
    },

    warn: (message: string, data?: any) => {
        console.warn(`⚠️ ${message}`, data || '');
    },

    error: (message: string, error?: any) => {
        console.error(`❌ ${message}`, error || '');
    },

    debug: (message: string, data?: any) => {
        if (!isDev) return;
        console.log(`🐛 ${message}`, data || '');
    },
};
