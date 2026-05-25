import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: categories } = await supabase.from('product_categories').select('*').limit(1);
  const { data: products } = await supabase.from('catalog_products').select('*').limit(1);
  console.log('Categories:', categories);
  console.log('Products:', products);
}
test();
