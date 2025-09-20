import { Request, Response } from 'express'
import { ProductService } from '@/services/product'
import { AppError, asyncHandler } from '@/middleware/error'
import type { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest,
  SearchFiltersRequest,
  ApiResponse,
  InventoryAdjustmentRequest
} from '@/types'

export class ProductController {
  private productService: ProductService

  constructor() {
    this.productService = ProductService.getInstance()
  }

  // Create new product
  createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const productData: CreateProductRequest = req.body
    const product = await this.productService.createProduct(req.userId, productData)

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    } as ApiResponse<Product>)
  })

  // Get product by ID
  getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    
    if (!id) {
      throw new AppError('Product ID is required', 400)
    }
    
    const product = await this.productService.getProductById(id)

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    res.status(200).json({
      success: true,
      data: product
    } as ApiResponse<Product>)
  })

  // Search products
  searchProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters: SearchFiltersRequest = req.query
    const result = await this.productService.searchProducts(filters)

    res.status(200).json(result)
  })

  // Get products by seller
  getSellerProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { page = 1, limit = 20 } = req.query
    const result = await this.productService.getProductsBySeller(
      req.userId, 
      Number(page), 
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get products by specific seller (for public viewing)
  getProductsBySeller = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params
    const { page = 1, limit = 20 } = req.query
    
    if (!sellerId) {
      throw new AppError('Seller ID is required', 400)
    }
    
    const result = await this.productService.getProductsBySeller(
      sellerId, 
      Number(page), 
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Update product
  updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    const updates: UpdateProductRequest = req.body

    if (!id) {
      throw new AppError('Product ID is required', 400)
    }

    const product = await this.productService.updateProduct(id, req.userId, updates)

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    } as ApiResponse<Product>)
  })

  // Delete product
  deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    
    if (!id) {
      throw new AppError('Product ID is required', 400)
    }
    
    await this.productService.deleteProduct(id, req.userId)

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    } as ApiResponse)
  })

  // Get featured products
  getFeaturedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { limit = 8 } = req.query
    const products = await this.productService.getFeaturedProducts(Number(limit))

    res.status(200).json({
      success: true,
      data: products
    } as ApiResponse<Product[]>)
  })

  // Get products by category
  getProductsByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params
    const { page = 1, limit = 20 } = req.query

    if (!categoryId) {
      throw new AppError('Category ID is required', 400)
    }

    const result = await this.productService.getProductsByCategory(
      categoryId,
      Number(page),
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Update product variant
  updateProductVariant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { variantId } = req.params
    const updates = req.body

    if (!variantId) {
      throw new AppError('Variant ID is required', 400)
    }

    const variant = await this.productService.updateProductVariant(variantId, updates)

    res.status(200).json({
      success: true,
      message: 'Product variant updated successfully',
      data: variant
    } as ApiResponse)
  })

  // Delete product variant
  deleteProductVariant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { variantId } = req.params

    if (!variantId) {
      throw new AppError('Variant ID is required', 400)
    }

    await this.productService.deleteProductVariant(variantId)

    res.status(200).json({
      success: true,
      message: 'Product variant deleted successfully'
    } as ApiResponse)
  })

  // Adjust inventory
  adjustInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    const adjustmentData: InventoryAdjustmentRequest = req.body
    const movement = await this.productService.adjustInventory(adjustmentData, req.userId)

    res.status(200).json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: movement
    } as ApiResponse)
  })

  // Get inventory movements
  getInventoryMovements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { productId, variantId, page = 1, limit = 20 } = req.query

    const result = await this.productService.getInventoryMovements(
      productId as string,
      variantId as string,
      Number(page),
      Number(limit)
    )

    res.status(200).json(result)
  })

  // Get low stock products
  getLowStockProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    // Only allow sellers and admins to see low stock
    if (req.user?.role !== 'seller' && req.user?.role !== 'admin') {
      throw new AppError('Not authorized', 403)
    }

    const { threshold = 10 } = req.query
    const products = await this.productService.getLowStockProducts(Number(threshold))

    res.status(200).json({
      success: true,
      data: products
    } as ApiResponse<Product[]>)
  })

  // Bulk update products
  bulkUpdateProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401)
    }

    // Only allow sellers and admins
    if (req.user?.role !== 'seller' && req.user?.role !== 'admin') {
      throw new AppError('Not authorized', 403)
    }

    const { productIds, updates } = req.body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new AppError('Product IDs are required', 400)
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new AppError('Updates are required', 400)
    }

    await this.productService.bulkUpdateProducts(productIds, updates)

    res.status(200).json({
      success: true,
      message: 'Products updated successfully'
    } as ApiResponse)
  })

  // Get product by slug
  getProductBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params

    if (!slug) {
      throw new AppError('Product slug is required', 400)
    }

    // For now, we'll search by slug using the search function
    // In a real implementation, you might want to add a dedicated method
    const filters: SearchFiltersRequest = {
      query: slug,
      limit: 1
    }

    const result = await this.productService.searchProducts(filters)
    const product = result.data?.[0]

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    res.status(200).json({
      success: true,
      data: product
    } as ApiResponse<Product>)
  })
}