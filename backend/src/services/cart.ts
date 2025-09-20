import { supabase } from './database'
import type { 
  ShoppingCart, 
  CartItem, 
  AddToCartRequest,
  UpdateCartItemRequest,
  ApiResponse 
} from '@/types'

export class CartService {
  private static instance: CartService

  private constructor() {}

  public static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService()
    }
    return CartService.instance
  }

  // Get or create active cart for user
  async getOrCreateCart(userId: string): Promise<ShoppingCart> {
    // Try to get existing active cart
    let { data: cart, error } = await supabase
      .from('shopping_cart')
      .select(`
        *,
        items:cart_items(
          *,
          product:products(*),
          variant:product_variants(*)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !cart) {
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from('shopping_cart')
        .insert({
          user_id: userId,
          status: 'active'
        })
        .select()
        .single()

      if (createError || !newCart) {
        throw new Error(createError?.message || 'Failed to create cart')
      }

      cart = { ...newCart, items: [] }
    }

    // Calculate totals
    cart.total_items = cart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    cart.subtotal = cart.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0

    return cart
  }

  // Add item to cart
  async addToCart(userId: string, itemData: AddToCartRequest): Promise<ShoppingCart> {
    const { product_id, variant_id, quantity } = itemData

    // Get or create cart
    const cart = await this.getOrCreateCart(userId)

    // Get product details and price
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('id', product_id)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Determine price
    let price = product.price
    if (variant_id) {
      const variant = product.variants?.find((v: any) => v.id === variant_id)
      if (!variant) {
        throw new Error('Product variant not found')
      }
      price = variant.price || product.price
    }

    if (!price) {
      throw new Error('Product price not available')
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .eq('variant_id', variant_id || null)
      .single()

    if (existingItem) {
      // Update existing item quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    } else {
      // Add new item to cart
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id,
          variant_id,
          quantity,
          price
        })

      if (insertError) {
        throw new Error(insertError.message)
      }
    }

    // Return updated cart
    return this.getOrCreateCart(userId)
  }

  // Update cart item quantity
  async updateCartItem(userId: string, itemId: string, updates: UpdateCartItemRequest): Promise<ShoppingCart> {
    const { quantity } = updates

    // Verify item belongs to user's cart
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        *,
        cart:shopping_cart(user_id)
      `)
      .eq('id', itemId)
      .single()

    if (itemError || !item || item.cart.user_id !== userId) {
      throw new Error('Cart item not found')
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return this.removeCartItem(userId, itemId)
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return this.getOrCreateCart(userId)
  }

  // Remove item from cart
  async removeCartItem(userId: string, itemId: string): Promise<ShoppingCart> {
    // Verify item belongs to user's cart
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        *,
        cart:shopping_cart(user_id)
      `)
      .eq('id', itemId)
      .single()

    if (itemError || !item || item.cart.user_id !== userId) {
      throw new Error('Cart item not found')
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    return this.getOrCreateCart(userId)
  }

  // Clear cart
  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId)

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)

    if (error) {
      throw new Error(error.message)
    }
  }

  // Get cart summary
  async getCartSummary(userId: string): Promise<{
    total_items: number
    subtotal: number
    estimated_tax: number
    estimated_shipping: number
    estimated_total: number
  }> {
    const cart = await this.getOrCreateCart(userId)
    
    const subtotal = cart.subtotal || 0
    const estimatedTax = subtotal * 0.08 // 8% estimated tax
    const estimatedShipping = subtotal > 50 ? 0 : 9.99 // Free shipping over $50
    const estimatedTotal = subtotal + estimatedTax + estimatedShipping

    return {
      total_items: cart.total_items || 0,
      subtotal,
      estimated_tax: estimatedTax,
      estimated_shipping: estimatedShipping,
      estimated_total: estimatedTotal
    }
  }

  // Validate cart before checkout
  async validateCart(userId: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const cart = await this.getOrCreateCart(userId)
    const errors: string[] = []
    const warnings: string[] = []

    if (!cart.items || cart.items.length === 0) {
      errors.push('Cart is empty')
      return { valid: false, errors, warnings }
    }

    // Check stock availability and prices
    for (const item of cart.items) {
      const { data: product } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('id', item.product_id)
        .eq('is_active', true)
        .single()

      if (!product) {
        errors.push(`Product "${item.product?.title}" is no longer available`)
        continue
      }

      // Check stock
      let availableStock = product.stock_quantity
      if (item.variant_id) {
        const variant = product.variants?.find((v: any) => v.id === item.variant_id)
        if (!variant) {
          errors.push(`Product variant is no longer available`)
          continue
        }
        availableStock = variant.stock_quantity
      }

      if (product.track_quantity && availableStock < item.quantity) {
        if (availableStock === 0) {
          errors.push(`"${product.title}" is out of stock`)
        } else {
          errors.push(`Only ${availableStock} units of "${product.title}" available`)
        }
      }

      // Check price changes
      let currentPrice = product.price
      if (item.variant_id) {
        const variant = product.variants?.find((v: any) => v.id === item.variant_id)
        currentPrice = variant?.price || product.price
      }

      if (currentPrice !== item.price) {
        warnings.push(`Price of "${product.title}" has changed from $${item.price} to $${currentPrice}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}