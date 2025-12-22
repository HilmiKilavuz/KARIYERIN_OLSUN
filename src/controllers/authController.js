import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Initialize Supabase client
// Note: In a real app, these should be in env variables. 
// Using the keys provided in cv_parser.py for consistency as requested.
const supabaseUrl = "https://huyyknstzknrmdbafpwq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eXlrbnN0emtucm1kYmFmcHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzY5OTYsImV4cCI6MjA3NjcxMjk5Nn0.fRnZB8CbhIrYaewx1736Yn-TEM_4ds7hgDOLO2_MB0M"; // Updated by user
const supabase = createClient(supabaseUrl, supabaseKey);

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        logger.auth('Login attempt', email);

        // 1. Check user in 'users' table
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password) // Plain text check as per plan
            .single();

        if (error) {
            logger.error('Supabase hatası', error);
        }

        if (!user) {
            logger.warn('Login başarısız - Kullanıcı bulunamadı', email);
            return res.status(401).json({ success: false, message: 'Geçersiz e-posta veya şifre.' });
        }

        logger.success('Kullanıcı giriş yaptı', { id: user.id, email: user.email });

        // 2. Fetch user's CV profile (if exists)
        const { data: profile } = await supabase
            .from('aday_profil')
            .select('*')
            .eq('user_id', user.id)
            .single();

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                ad_soyad: user.ad_soyad,
                profile_id: profile ? profile.id : null
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Giriş işlemi başarısız.' });
    }
};

export const register = async (req, res) => {
    const { email, password, ad_soyad } = req.body;

    try {
        // 1. Check if email exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Bu e-posta adresi zaten kayıtlı.' });
        }

        // 2. Create new user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{ email, password, ad_soyad }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
            user: newUser
        });

    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ success: false, message: 'Kayıt işlemi başarısız.' });
    }
};

export const updateProfile = async (req, res) => {
    const { userId, ad_soyad, email, currentPassword, newPassword, profileData } = req.body;

    try {
        // 1. Verify user exists
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        // 2. Prepare User updates
        const userUpdates = {};
        if (ad_soyad) userUpdates.ad_soyad = ad_soyad;
        if (email) userUpdates.email = email;

        // 3. Handle password change
        if (newPassword) {
            if (user.password !== currentPassword) {
                return res.status(400).json({ success: false, message: 'Mevcut şifre yanlış.' });
            }
            userUpdates.password = newPassword;
        }

        // 4. Perform User update
        if (Object.keys(userUpdates).length > 0) {
            const { error: updateError } = await supabase
                .from('users')
                .update(userUpdates)
                .eq('id', userId);

            if (updateError) throw updateError;
        }

        // 5. Handle CV Profile updates (aday_profil)
        if (profileData) {
            const { draftId } = req.body;
            let finalProfileData = { ...profileData };

            // If we are approving a draft, we need to merge the draft's full data
            if (draftId) {
                const { data: draft, error: draftError } = await supabase
                    .from('cv_drafts')
                    .select('*')
                    .eq('id', draftId)
                    .single();

                if (draftError || !draft) {
                    throw new Error("Draft not found");
                }

                // Exclude system fields
                const { id, created_at, user_id, status, ...draftContent } = draft;

                finalProfileData = {
                    ...draftContent, // Base data from draft
                    ...profileData,   // Overwrite with user edits
                    user_id: userId,
                    status: 'approved'
                };
            } else {
                finalProfileData = { user_id: userId, ...profileData, status: 'approved' };
            }

            // Upsert into aday_profil
            const { error: upsertError } = await supabase
                .from('aday_profil')
                .upsert(finalProfileData, { onConflict: 'user_id' });

            if (upsertError) {
                console.error("Upsert Error:", upsertError);
                throw upsertError;
            }

            // If this came from a draft, mark the draft as approved
            if (draftId) {
                await supabase
                    .from('cv_drafts')
                    .update({ status: 'approved' })
                    .eq('id', draftId);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Profil başarıyla güncellendi.'
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ success: false, message: 'Güncelleme işlemi başarısız.' });
    }
};

export const getAnalysisResult = async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch analysis result from 'analiz_sonuclari' table
        // filtering by 'aday_id' (which corresponds to the user's profile ID or user ID)
        // Here we assume aday_id in analiz_sonuclari corresponds to the 'id' in aday_profil.
        // First we need to get the profile id for the user.

        // Logic Correction: The Analysis Engine (Python) reads from 'aday_profil' and uses its 'id' (Primary Key)
        // as the 'aday_id' in 'analiz_sonuclari'.
        // So we MUST Find Profile ID from User ID first. Direct match (userId = aday_id) will fail.

        const { data: profile, error: profileError } = await supabase
            .from('aday_profil')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (profileError || !profile) {
            // If profile doesn't exist, they definitely don't have analysis
            return res.status(200).json({ success: true, analysis: null, message: "Profil bulunamadı." });
        }

        const { data: analysis, error: analysisError } = await supabase
            .from('analiz_sonuclari')
            .select('*')
            .eq('aday_id', profile.id) // Correct mapping: aday_id = aday_profil.id
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (analysisError) {
            // It's possible analysis isn't ready yet
            return res.status(200).json({ success: true, analysis: null, message: "Analiz bulunamadı." });
        }

        res.status(200).json({ success: true, analysis });

    } catch (err) {
        console.error('Get Analysis Error:', err);
        res.status(500).json({ success: false, message: 'Analiz sonuçları alınamadı.' });
    }
};

export const getProfile = async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Get User
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, ad_soyad')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        // 2. Get CV Profile
        const { data: profile } = await supabase
            .from('aday_profil')
            .select('*')
            .eq('user_id', userId)
            .single();

        // 3. Get Pending Draft (if any)
        const { data: draft } = await supabase
            .from('cv_drafts')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        res.status(200).json({
            success: true,
            user,
            profile: profile || {},
            draft: draft || null
        });

    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ success: false, message: 'Profil bilgileri alınamadı.' });
    }
};

export const getInterviewHistory = async (req, res) => {
    const { userId } = req.params;

    try {
        const { data: history, error } = await supabase
            .from('mulakat_gecmisi')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Interview History Error:', error);
            return res.status(500).json({ success: false, message: 'Mulakat gecmisi alinamadi.' });
        }

        res.status(200).json({
            success: true,
            data: history || []
        });

    } catch (err) {
        console.error('Get Interview History Error:', err);
        res.status(500).json({ success: false, message: 'Mulakat gecmisi alinamadi.' });
    }
};
