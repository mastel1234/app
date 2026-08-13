import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywzzniydtbsnrpbafoex.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ga1COBxS0rD01lXcH_N6jw_fU6_Y4xE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);