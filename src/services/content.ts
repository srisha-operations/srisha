import { supabase } from "@/lib/supabaseClient";

// ----------------------------
// Get content row by key
// ----------------------------
export const getContent = async (key: string) => {
  const { data, error } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .single();

  return { data, error };
};

// ----------------------------
// Update content row
// ----------------------------
export const updateContent = async (key: string, value: any) => {
  const { data, error } = await supabase
    .from("site_content")
    .update({ value })
    .eq("key", key)
    .select()
    .single();

  return { data, error };
};

// ----------------------------
// Generic image upload helper
// ----------------------------
export const uploadImage = async (bucket: string, file: File) => {
  const filename = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, file);

  if (uploadError) return { url: null, error: uploadError };

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);

  return { url: publicUrlData.publicUrl, error: null };
};
