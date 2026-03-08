import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .upsert({ name: "Demo Restaurant", gstin: "29ABCDE1234F1Z5", address: "123 MG Road, Bengaluru", phone: "+91 9876543210", email: "demo@foodpos.in" }, { onConflict: "name" })
      .select()
      .single();

    if (orgError) {
      // Try select if upsert fails (no unique constraint on name)
      const { data: existingOrg } = await supabase.from("organizations").select().eq("name", "Demo Restaurant").single();
      if (!existingOrg) {
        const { data: newOrg, error: insertErr } = await supabase.from("organizations").insert({ name: "Demo Restaurant", gstin: "29ABCDE1234F1Z5", address: "123 MG Road, Bengaluru", phone: "+91 9876543210", email: "demo@foodpos.in" }).select().single();
        if (insertErr) throw insertErr;
        var orgId = newOrg.id;
      } else {
        var orgId = existingOrg.id;
      }
    } else {
      var orgId = org.id;
    }

    // Demo users
    const demoUsers = [
      { email: "admin@foodpos.in", password: "admin123", fullName: "Admin User", role: "admin" },
      { email: "manager@foodpos.in", password: "manager123", fullName: "Manager User", role: "manager" },
      { email: "cashier@foodpos.in", password: "cashier123", fullName: "Cashier User", role: "cashier" },
      { email: "waiter@foodpos.in", password: "waiter123", fullName: "Waiter User", role: "waiter" },
      { email: "kitchen@foodpos.in", password: "kitchen123", fullName: "Kitchen Staff", role: "kitchen_staff" },
    ];

    const results = [];

    for (const u of demoUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });

      if (authError && authError.message?.includes("already been registered")) {
        // User exists, get their id
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users?.find((x: any) => x.email === u.email);
        if (existing) {
          // Ensure profile has org_id
          await supabase.from("profiles").update({ organization_id: orgId }).eq("user_id", existing.id);
          // Ensure role
          await supabase.from("user_roles").upsert({ user_id: existing.id, role: u.role }, { onConflict: "user_id,role" });
          results.push({ email: u.email, status: "exists", role: u.role });
        }
        continue;
      }
      if (authError) throw authError;

      const userId = authData.user!.id;

      // Update profile with org
      await supabase.from("profiles").update({ organization_id: orgId }).eq("user_id", userId);

      // Assign role
      await supabase.from("user_roles").insert({ user_id: userId, role: u.role });

      results.push({ email: u.email, status: "created", role: u.role });
    }

    // Seed menu categories
    const categories = [
      { name: "Starters", sort_order: 1, organization_id: orgId },
      { name: "Main Course", sort_order: 2, organization_id: orgId },
      { name: "Breads", sort_order: 3, organization_id: orgId },
      { name: "Beverages", sort_order: 4, organization_id: orgId },
      { name: "Desserts", sort_order: 5, organization_id: orgId },
    ];

    for (const cat of categories) {
      const { data: existing } = await supabase.from("menu_categories").select("id").eq("name", cat.name).eq("organization_id", orgId).single();
      if (!existing) {
        await supabase.from("menu_categories").insert(cat);
      }
    }

    // Get categories for linking
    const { data: cats } = await supabase.from("menu_categories").select("id, name").eq("organization_id", orgId);
    const catMap: Record<string, string> = {};
    cats?.forEach((c: any) => { catMap[c.name] = c.id; });

    // Seed menu items
    const menuItems = [
      { name: "Paneer Tikka", price: 280, gst_rate: 5, category_id: catMap["Starters"], is_veg: true, organization_id: orgId },
      { name: "Chicken 65", price: 320, gst_rate: 5, category_id: catMap["Starters"], is_veg: false, organization_id: orgId },
      { name: "Veg Spring Roll", price: 200, gst_rate: 5, category_id: catMap["Starters"], is_veg: true, organization_id: orgId },
      { name: "Butter Chicken", price: 380, gst_rate: 5, category_id: catMap["Main Course"], is_veg: false, organization_id: orgId },
      { name: "Dal Makhani", price: 260, gst_rate: 5, category_id: catMap["Main Course"], is_veg: true, organization_id: orgId },
      { name: "Palak Paneer", price: 280, gst_rate: 5, category_id: catMap["Main Course"], is_veg: true, organization_id: orgId },
      { name: "Biryani", price: 350, gst_rate: 5, category_id: catMap["Main Course"], is_veg: false, organization_id: orgId },
      { name: "Chole Bhature", price: 220, gst_rate: 5, category_id: catMap["Main Course"], is_veg: true, organization_id: orgId },
      { name: "Butter Naan", price: 60, gst_rate: 5, category_id: catMap["Breads"], is_veg: true, organization_id: orgId },
      { name: "Garlic Naan", price: 70, gst_rate: 5, category_id: catMap["Breads"], is_veg: true, organization_id: orgId },
      { name: "Tandoori Roti", price: 40, gst_rate: 5, category_id: catMap["Breads"], is_veg: true, organization_id: orgId },
      { name: "Masala Chai", price: 40, gst_rate: 5, category_id: catMap["Beverages"], is_veg: true, organization_id: orgId },
      { name: "Lassi", price: 80, gst_rate: 5, category_id: catMap["Beverages"], is_veg: true, organization_id: orgId },
      { name: "Fresh Lime Soda", price: 60, gst_rate: 5, category_id: catMap["Beverages"], is_veg: true, organization_id: orgId },
      { name: "Gulab Jamun", price: 120, gst_rate: 5, category_id: catMap["Desserts"], is_veg: true, organization_id: orgId },
      { name: "Rasmalai", price: 140, gst_rate: 5, category_id: catMap["Desserts"], is_veg: true, organization_id: orgId },
    ];

    for (const item of menuItems) {
      const { data: existing } = await supabase.from("menu_items").select("id").eq("name", item.name).eq("organization_id", orgId).single();
      if (!existing) {
        await supabase.from("menu_items").insert(item);
      }
    }

    // Seed tables
    const tables = [
      { table_number: "T1", capacity: 2, section: "Main", organization_id: orgId, pos_x: 0, pos_y: 0 },
      { table_number: "T2", capacity: 4, section: "Main", organization_id: orgId, pos_x: 1, pos_y: 0 },
      { table_number: "T3", capacity: 4, section: "Main", organization_id: orgId, pos_x: 2, pos_y: 0 },
      { table_number: "T4", capacity: 6, section: "Main", organization_id: orgId, pos_x: 0, pos_y: 1 },
      { table_number: "T5", capacity: 2, section: "Patio", organization_id: orgId, pos_x: 1, pos_y: 1 },
      { table_number: "T6", capacity: 8, section: "Patio", organization_id: orgId, pos_x: 2, pos_y: 1 },
      { table_number: "T7", capacity: 4, section: "VIP", organization_id: orgId, pos_x: 0, pos_y: 2 },
      { table_number: "T8", capacity: 4, section: "VIP", organization_id: orgId, pos_x: 1, pos_y: 2 },
    ];

    for (const t of tables) {
      const { data: existing } = await supabase.from("restaurant_tables").select("id").eq("table_number", t.table_number).eq("organization_id", orgId).single();
      if (!existing) {
        await supabase.from("restaurant_tables").insert(t);
      }
    }

    return new Response(JSON.stringify({ success: true, orgId, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
