import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://huyyknstzknrmdbafpwq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eXlrbnN0emtucm1kYmFmcHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzY5OTYsImV4cCI6MjA3NjcxMjk5Nn0.fRnZB8CbhIrYaewx1736Yn-TEM_4ds7hgDOLO2_MB0M";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- Debugging Database ---");

    // 1. Get Users
    const { data: users, error: userError } = await supabase.from('users').select('id, email').limit(5);
    if (userError) console.error("User Error:", userError);
    console.log("Users:", users);

    // 2. Get Profiles
    const { data: profiles, error: profileError } = await supabase.from('aday_profil').select('id, user_id, ad_soyad, status, yetenekler').limit(5);
    if (profileError) console.error("Profile Error:", profileError);
    console.log("Profiles:", profiles);

    // 3. Get Analysis Results
    const { data: analysis, error: analysisError } = await supabase.from('analiz_sonuclari').select('id, aday_id, detected_role, overall_score').limit(5);
    if (analysisError) console.error("Analysis Error:", analysisError);
    console.log("Analysis Results:", analysis);

    // Check specific user 2
    console.log("\n--- Checking for User ID: 2 ---");
    const user2 = users?.find(u => u.id === 2);
    if (user2) {
        console.log("User 2 found.");
        const profile2 = profiles?.find(p => p.user_id === 2);
        if (profile2) {
            console.log(`User 2 has Profile ID: ${profile2.id}`);
            console.log(`Profile Status: ${profile2.status}`);
            console.log(`Profile Skills: ${JSON.stringify(profile2.yetenekler)}`);

            const analysis2 = analysis?.find(a => a.aday_id === profile2.id);
            if (analysis2) {
                console.log("MATCH! Analysis found for Profile ID " + profile2.id);
            } else {
                console.log("NO MATCH. No analysis for Profile ID " + profile2.id);
                // Check if maybe it's linked to user_id directly?
                const analysisDirect = analysis?.find(a => a.aday_id === 2);
                if (analysisDirect) console.log("BUT! Analysis found linked directly to User ID 2!");
            }
        } else {
            console.log("User 2 has NO Profile.");
        }
    }
}

debug();
