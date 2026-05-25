import { getSupabaseAdmin } from "./lib/supabase/server.js";
import 'dotenv/config';

async function test() {
  const supabase = getSupabaseAdmin();
  const { data: categories } = await supabase.from('product_categories').select('*');
  const { data: products } = await supabase.from('catalog_products').select('*');
  console.log('Cat len', categories?.length, 'Prod len', products?.length);
}
test();
