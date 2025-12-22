import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/env.js';

export const uploadCvToParser = async (fileBuffer, originalName, mimeType, userId) => {
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: originalName,
            contentType: mimeType,
        });
        if (userId) {
            formData.append('userId', userId);
        }

        console.log(`Proxying CV to Parser at ${config.cvParserUrl}...`);
        const response = await axios.post(`${config.cvParserUrl}/upload_cv`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        return response.data;
    } catch (error) {
        console.error('CV Parser Service Error:', error.message);
        throw error;
    }
};
