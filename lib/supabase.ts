import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  "";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
