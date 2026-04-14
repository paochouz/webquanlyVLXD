import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zbqzwizocalmovcvlpjv.supabase.co'
const supabaseKey = 'sb_publishable_QqzgyUscJkWsT5JpGPKXaA_FpIAP6Qf'

export const supabase = createClient(supabaseUrl, supabaseKey)
