import { supabase } from './database'
import type { 
  Product, 
  ProductVariant, 
  CreateProductRequest, 
  UpdateProductRequest,
  CreateProductVariantRequest,
  SearchFiltersRequest,
  ApiResponse,
  InventoryMovement,
  InventoryAdjustmentRequest
} from '@/types'

export class ProductService {
  private static instance: ProductService

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService()
    }
    return ProductService.instance
  }

  // Create a new product
  async createProduct(sellerId: string, productData: CreateProductRequest): Promise<Product> {
    const { variants, ...productInfo } = productData

    // Generate slug from title if not provided
    const productWithSlug = {
      ...productInfo,
      slug: (productInfo as any).slug || this.generateSlug(productInfo.title)
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productWithSlug,
        seller_id: sellerId
      })
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*)
      `)
      .single()

    if (error || !product) {
      throw new Error(error?.message || 'Failed to create product')
    }

    // Create variants if provided
    if (variants && variants.length > 0) {
      await this.createProductVariants(product.id, variants)
    }

    return product
  }

  // Get product by ID
  async getProductById(productId: string): Promise<Product | null> {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*),
        variants:product_variants(*),
        reviews:product_reviews(*, user:users(id, full_name, avatar_url))
      `)
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (error) {
      return null
    }

    // Calculate average rating
    if (product.reviews && product.reviews.length > 0) {
      const ratings = product.reviews.filter((r: any) => r.is_approved)
      product.average_rating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      product.review_count = ratings.length
    }

    return product
  }

  // Search products with filters
  async searchProducts(filters: SearchFiltersRequest): Promise<ApiResponse<Product[]>> {
    const {
      query,
      category,
      condition,
      type,
      minPrice,
      maxPrice,
      brand,
      tags,
      inStock,
      featured,
      sortBy = 'created_at',
      page = 1,
      limit = 20
    } = filters

    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        seller:users(id, full_name, avatar_url),
        category:categories(*)
      `, { count: 'exact' })
      .eq('is_active', true)

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%, description.ilike.%${query}%, brand.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category)
    }

    if (condition) {
      queryBuilder = queryBuilder.eq('condition', condition)
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type)
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice)
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice)
    }

    if (brand) {
      queryBuilder = queryBuilder.ilike('brand', `%${brand}%`)
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', tags)
    }

    if (inStock) {
      queryBuilder = queryBuilder.gt('stock_quantity', 0)
    }

    if (featured) {
      queryBuilder = queryBuilder.eq('is_featured', true)
    }

    // Apply sorting
    const sortOptions: Record<string, string> = {
      'created_at': 'created_at.desc',
      'price_asc': 'price.asc',
      'price_desc': 'price.desc',
      'title': 'title.asc',
      'featured': 'is_featured.desc,created_at.desc'
    }

    const sortOrder = sortOptions[sortBy] || 'created_at.desc'
    const [column, direction] = sortOrder.split('.')
    
    if (column) {
      queryBuilder = queryBuilder.order(column, { 
        ascending: direction === 'asc'
      })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: products, error, count } = await queryBuilder

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Get products by seller
  async getProductsBySeller(sellerId: string, page = 1, limit = 20): Promise<ApiResponse<Product[]>> {
    const offset = (page - 1) * limit

    const { data: products, error, count } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Update product
  async updateProduct(productId: string, sellerId: string, updates: UpdateProductRequest): Promise<Product> {
    // Verify ownership
    const { data: existing } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (!existing || existing.seller_id !== sellerId) {
      throw new Error('Product not found or unauthorized')
    }

    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select(`
        *,
        seller:users!seller_id(*),
        category:categories(*),
        variants:product_variants(*)
      `)
      .single()

    if (error || !product) {
      throw new Error(error?.message || 'Failed to update product')
    }

    return product
  }

  // Delete product
  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    // Verify ownership
    const { data: existing } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (!existing || existing.seller_id !== sellerId) {
      throw new Error('Product not found or unauthorized')
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)

    if (error) {
      throw new Error(error.message)
    }
  }

  // Get featured products
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(id, full_name, avatar_url),
        category:categories(*)
      `)
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return products || []
  }

  // Create product variants
  async createProductVariants(productId: string, variants: CreateProductVariantRequest[]): Promise<ProductVariant[]> {
    const variantsWithProductId = variants.map(variant => ({
      ...variant,
      product_id: productId
    }))

    const { data: createdVariants, error } = await supabase
      .from('product_variants')
      .insert(variantsWithProductId)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    return createdVariants || []
  }

  // Update product variant
  async updateProductVariant(variantId: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(updates)
      .eq('id', variantId)
      .select()
      .single()

    if (error || !variant) {
      throw new Error(error?.message || 'Failed to update variant')
    }

    return variant
  }

  // Delete product variant
  async deleteProductVariant(variantId: string): Promise<void> {
    const { error } = await supabase
      .from('product_variants')
      .update({ is_active: false })
      .eq('id', variantId)

    if (error) {
      throw new Error(error.message)
    }
  }

  // Inventory management
  async adjustInventory(adjustmentData: InventoryAdjustmentRequest, userId: string): Promise<InventoryMovement> {
    const { product_id, variant_id, quantity_change, notes } = adjustmentData

    // Get current stock
    let currentStock = 0
    if (variant_id) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variant_id)
        .single()
      currentStock = variant?.stock_quantity || 0
    } else if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', product_id)
        .single()
      currentStock = product?.stock_quantity || 0
    }

    const newStock = currentStock + quantity_change

    // Update stock
    if (variant_id) {
      await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', variant_id)
    } else if (product_id) {
      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product_id)
    }

    // Log inventory movement
    const { data: movement, error } = await supabase
      .from('inventory_movements')
      .insert({
        product_id,
        variant_id,
        movement_type: 'adjustment',
        quantity_change,
        quantity_after: newStock,
        notes,
        created_by: userId
      })
      .select()
      .single()

    if (error || !movement) {
      throw new Error(error?.message || 'Failed to log inventory movement')
    }

    return movement
  }

  // Get inventory movements
  async getInventoryMovements(productId?: string, variantId?: string, page = 1, limit = 20): Promise<ApiResponse<InventoryMovement[]>> {
    const offset = (page - 1) * limit

    let queryBuilder = supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(id, title, sku),
        variant:product_variants(id, title, sku)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (productId) {
      queryBuilder = queryBuilder.eq('product_id', productId)
    }

    if (variantId) {
      queryBuilder = queryBuilder.eq('variant_id', variantId)
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: movements, error, count } = await queryBuilder

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: movements || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold = 10): Promise<Product[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(id, full_name, email),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .eq('track_quantity', true)
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return products || []
  }

  // Helper method to generate slug
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Bulk update products
  async bulkUpdateProducts(productIds: string[], updates: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .in('id', productIds)

    if (error) {
      throw new Error(error.message)
    }
  }

  // Get products by category
  async getProductsByCategory(categoryId: string, page = 1, limit = 20): Promise<ApiResponse<Product[]>> {
    const offset = (page - 1) * limit

    const { data: products, error, count } = await supabase
      .from('products')
      .select(`
        *,
        seller:users(id, full_name, avatar_url),
        category:categories(*)
      `, { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      success: true,
      data: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  }
}