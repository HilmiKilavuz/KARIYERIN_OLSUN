import * as cvParserService from '../services/cvParserService.js';
import { config } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

export const uploadCv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { buffer, originalname, mimetype } = req.file;
        const { userId } = req.body; // Expect userId in body

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Validate file type
        if (mimetype !== 'application/pdf') {
            return res.status(400).json({ message: 'Only PDF files are allowed' });
        }

        // 1. Upload to Supabase Storage - DISABLED BY USER REQUEST
        // We skip physical file storage to avoid RLS/Bucket issues.
        // const fileName = `${userId}_${Date.now()}_${originalname}`;
        // ... storage upload ...

        const cvFilePath = null; // No file path since we don't store it

        // 2. Parse CV
        // 2. Parse CV (and Parser Service will save to cv_drafts)
        const result = await cvParserService.uploadCvToParser(buffer, originalname, mimetype, userId);

        // No direct update to aday_profil here. The parser saves to cv_drafts.
        // Frontend will fetch from cv_drafts to populate the form.

        res.status(200).json({
            success: true,
            message: 'CV taslağı oluşturuldu.',
            data: result,
        });
    } catch (error) {
        console.error('CV Upload Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process CV',
            error: error.message,
        });
    }
};

export const deleteCv = async (req, res) => {
    const { userId } = req.body;

    try {
        // 1. Get current profile to find file path
        const { data: profile } = await supabase
            .from('aday_profil')
            .select('cv_file_path')
            .eq('user_id', userId)
            .single();

        if (profile && profile.cv_file_path) {
            // 2. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('cvs')
                .remove([profile.cv_file_path]);

            if (storageError) console.error("Storage delete error", storageError);
        }

        // 3. Clear CV data from DB (but keep the row? or delete row? User said "remove CV". 
        // Usually we just nullify the CV fields or delete the row if profile is 1:1 with CV.
        // Let's delete the row to be clean, or just nullify fields. 
        // Deleting row is safer to "reset" everything as requested.)

        const { error: dbError } = await supabase
            .from('aday_profil')
            .delete()
            .eq('user_id', userId);

        if (dbError) throw dbError;

        res.status(200).json({ success: true, message: 'CV ve profil verileri silindi.' });

    } catch (error) {
        console.error('Delete CV Error:', error);
        res.status(500).json({ success: false, message: 'CV silinemedi.' });
    }
};

export const getAnalysis = async (req, res) => {
    const { id } = req.params; // This is the profile_id (aday_id)

    try {
        // Fetch analysis result from 'analiz_sonuclari' table
        const { data: analysis, error } = await supabase
            .from('analiz_sonuclari')
            .select('*')
            .eq('aday_id', id)
            .order('created_at', { ascending: false }) // Get the latest one
            .limit(1)
            .single();

        if (error) {
            // If no data found, it might not be an error, just no analysis yet
            if (error.code === 'PGRST116') { // JSON object requested, multiple (or no) rows returned
                return res.status(200).json({ success: true, data: null, message: "Henüz analiz bulunamadı." });
            }
            console.error('Supabase Get Analysis Error:', error);
            return res.status(500).json({ success: false, message: 'Veri çekilemedi.' });
        }

        // We also need the raw parsed data which might be in 'aday_profil' or stored in 'analiz_sonuclari'
        // Looking at the CSV, 'analiz_sonuclari' has 'report_text' and scores.
        // 'aday_profil' has 'yetenekler' etc.

        // Let's fetch the profile data too to construct the full graph data
        const { data: profile, error: profileError } = await supabase
            .from('aday_profil')
            .select('*')
            .eq('id', id)
            .single();

        if (profileError) {
            console.error('Supabase Get Profile Error:', profileError);
        }

        // Construct the response similar to what upload-cv returns
        // The frontend expects: { parsed_data: { yetenekler: [], ad_soyad: ... } }

        // Parse 'yetenekler' if it's a string in DB
        let skills = [];
        if (profile && profile.yetenekler) {
            // It might be a JSON string or array depending on DB
            // In CSV it looked like "Python, Java..." string or JSON
            // We'll try to handle both
            if (typeof profile.yetenekler === 'string') {
                skills = profile.yetenekler.split(',').map(s => s.trim());
            } else if (Array.isArray(profile.yetenekler)) {
                skills = profile.yetenekler;
            }
        }

        const responseData = {
            parsed_data: {
                ad_soyad: profile ? profile.ad_soyad : "Aday",
                yetenekler: skills,
                // Add other fields if needed
            },
            analysis_result: analysis // Include the detailed analysis report
        };

        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (err) {
        console.error('Get Analysis Error:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
};
