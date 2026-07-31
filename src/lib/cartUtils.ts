import { supabase } from "./supabase";

/**
 * Get or create a cart for the current user.
 */
export async function getOrCreateCart(userId: string): Promise<string | null> {
  // Step 1: Try get existing cart
  const { data: existing, error: fetchError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("[cartUtils] fetch cart error:", fetchError);
    return null;
  }

  if (existing?.id) return existing.id;

  // Step 2: Create new cart
  const { data: created, error: insertError } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (insertError) {
    console.error("[cartUtils] create cart error:", insertError);

    // If duplicate (user already has a cart in a race condition), try fetching again
    if (insertError.code === "23505") {
      const { data: retry } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      return retry?.id || null;
    }

    return null;
  }

  return created?.id || null;
}

/**
 * Add a book to the user's cart.
 */
export async function addToCart(
  userId: string,
  bookId: string
): Promise<"added" | "exists" | "error" | "db_missing"> {
  // Check if carts table exists
  const { error: tableCheck } = await supabase
    .from("carts")
    .select("id")
    .limit(1);

  if (tableCheck?.code === "42P01") {
    console.error("[cartUtils] Table 'carts' tidak ditemukan! Jalankan shopee_cart.sql.");
    return "db_missing";
  }

  const cartId = await getOrCreateCart(userId);
  if (!cartId) return "error";

  // Check if already in cart
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cartId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existing) return "exists";

  // Insert to cart
  const { error } = await supabase
    .from("cart_items")
    .insert({ cart_id: cartId, book_id: bookId });

  if (error) {
    console.error("[cartUtils] insert cart_item error:", error);
    return "error";
  }

  return "added";
}

/**
 * Check if a book is in user's cart.
 */
export async function isBookInCart(userId: string, bookId: string): Promise<boolean> {
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!cart?.id) return false;

  const { data } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cart.id)
    .eq("book_id", bookId)
    .maybeSingle();

  return !!data;
}

/**
 * Check if a book is already owned (in library).
 */
export async function isBookOwned(userId: string, bookId: string): Promise<boolean> {
  const { data } = await supabase
    .from("library")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  return !!data;
}
