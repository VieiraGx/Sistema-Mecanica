import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsaufvvdbpceipgynpid.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYXVmdnZkYnBjZWlwZ3lucGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDg2MzMsImV4cCI6MjEwNjg4NDYzM30.gBHxVnHRh9qJNdgwLKyhjKUG5xuNUKwkMTw-zcxR8j4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
