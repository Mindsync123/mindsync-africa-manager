// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vzbahbukoccxtmsefkly.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6YmFoYnVrb2NjeHRtc2Vma2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2OTIyODQsImV4cCI6MjA2NDI2ODI4NH0.5gGMiieRqyeaTShkGYFq7wY8gqzaO8sz_AXEELmobSc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);