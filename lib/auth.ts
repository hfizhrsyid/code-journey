import supabase from "./supabaseConfig";

// Sign up with email and password
export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({ email, password });
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

// Sign out
export async function signOut() {
  return await supabase.auth.signOut();
}