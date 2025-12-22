import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
const result = dotenv.config({ path: path.join(__dirname, '../../.env') });
if (result.error) {
    console.error("❌ Dotenv Error:", result.error);
} else {
    console.log("✅ Dotenv loaded:", result.parsed);
}

export const config = {
    port: process.env.PORT || 4000,
    cvParserUrl: process.env.CV_PARSER_URL || 'https://cv-parser-service-866597427116.europe-west1.run.app',
    avatarBotUrl: process.env.AVATAR_BOT_URL || 'http://avatar-projem-env.eba-aycpv2g7.eu-north-1.elasticbeanstalk.com', // AWS cloud
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
};
