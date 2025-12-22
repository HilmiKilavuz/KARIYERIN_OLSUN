import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://huyyknstzknrmdbafpwq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eXlrbnN0emtucm1kYmFmcHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzY5OTYsImV4cCI6MjA3NjcxMjk5Nn0.fRnZB8CbhIrYaewx1736Yn-TEM_4ds7hgDOLO2_MB0M";
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
    console.log("Resetting Profile 8 to pending...");
    const { data, error } = await supabase
        .from('aday_profil')
        .update({ status: 'pending' })
        .eq('id', 8)
        .select();

    if (error) console.error("Error:", error);
    else console.log("Success:", data);
}

reset();
