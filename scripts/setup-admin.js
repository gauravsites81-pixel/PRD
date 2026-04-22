// Script to backfill admin user in users table
// Run with: node scripts/setup-admin.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');

    // First, get the user from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail('gauravsites81@gmail.com');

    if (authError) {
      console.error('Error fetching auth user:', authError);
      return;
    }

    if (!authUser.user) {
      console.error('Admin user not found in auth.users. Please sign up first.');
      return;
    }

    console.log('Found auth user:', authUser.user.id, authUser.user.email);

    // Check if user exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return;
    }

    if (existingUser) {
      console.log('User already exists in public.users, updating role...');
      // Update existing user to admin role
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', authUser.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return;
      }

      console.log('User role updated to admin:', updatedUser);
    } else {
      console.log('Creating admin user in public.users...');
      // Create new user with admin role
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: 'Admin User',
          role: 'admin'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating admin user:', insertError);
        return;
      }

      console.log('Admin user created:', newUser);
    }

    console.log('Admin setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupAdmin();
