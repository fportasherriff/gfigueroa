import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ehpmvahaixellqfwwyam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocG12YWhhaXhlbGxxZnd3eWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjUzNDAsImV4cCI6MjA4NDE0MTM0MH0.VAfGXWOqrq-PpbA9zwvky3wi8td22luGPGl-VwEM_e4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
