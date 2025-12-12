
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmbngjpbngfkhquvfypc.supabase.co'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY as string
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase