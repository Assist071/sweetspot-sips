
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_type', 'delivery')
    .limit(5)

  if (error) {
    console.error('Error fetching orders:', error)
  } else {
    console.log('Recent Delivery Orders:')
    console.table(data.map(o => ({
      id: o.id.substring(0, 8),
      status: o.status,
      rider_id: o.rider_id ? 'SET' : 'NULL',
      type: o.order_type
    })))
  }
}

debugOrders()
