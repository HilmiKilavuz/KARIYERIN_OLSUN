// Professional Logger Utility for Backend (ES6)
// Categorized, colored, and emoji-enhanced logs

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

export const logger = {
    // System startup/shutdown
    system: (message, data = null) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.cyan}⚙️  [SYSTEM ${timestamp}]${colors.reset} ${message}`);
        if (data) console.log(colors.dim, data, colors.reset);
    },

    // Success messages
    success: (message, data = null) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.green}✅ [SUCCESS ${timestamp}]${colors.reset} ${message}`);
        if (data) console.log(colors.dim, '  →', data, colors.reset);
    },

    // Warnings
    warn: (message, data = null) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.yellow}⚠️  [UYARI ${timestamp}]${colors.reset} ${message}`);
        if (data) console.log(colors.dim, '  →', data, colors.reset);
    },

    // Errors
    error: (message, error = null) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.red}❌ [HATA ${timestamp}]${colors.reset} ${message}`);
        if (error) {
            console.log(colors.red, '  → Detay:', error.message || error, colors.reset);
        }
    },

    // Authentication
    auth: (action, user = null) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.green}� [AUTH ${timestamp}]${colors.reset} ${action}`);
        if (user) console.log(colors.dim, '  → Kullanıcı:', user, colors.reset);
    },

    // External service calls
    external: (service, action) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.blue}🔗 [EXTERNAL ${timestamp}]${colors.reset} ${service} - ${action}`);
    },

    // Database operations
    db: (operation, details = null) => {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`${colors.cyan}� [DB ${timestamp}]${colors.reset} ${operation}`);
        if (details) console.log(colors.dim, '  →', details, colors.reset);
    },
};
