import { Request, Response } from 'express'
import { CategoryService } from '@/services/category'
import { AppError, asyncHandler } from '@/middleware/error'
import type { Category, ApiResponse } from '@/types'

export class CategoryController {
  private categoryService: CategoryService

  constructor() {
    this.categoryService = CategoryService.getInstance()
  }

  // Get all categories
  getAllCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const categories = await this.categoryService.getAllCategories()

    res.status(200).json({
      success: true,
      data: categories
    } as ApiResponse<Category[]>)
  })

  // Get category by ID
  getCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    
    if (!id) {
      throw new AppError('Category ID is required', 400)
    }
    
    const category = await this.categoryService.getCategoryById(id)

    if (!category) {
      throw new AppError('Category not found', 404)
    }

    res.status(200).json({
      success: true,
      data: category
    } as ApiResponse<Category>)
  })

  // Get categories with auction counts
  getCategoriesWithCounts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const categories = await this.categoryService.getCategoriesWithCounts()

    res.status(200).json({
      success: true,
      data: categories
    } as ApiResponse<Array<Category & { auction_count: number }>>)
  })

  // Get parent categories
  getParentCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const categories = await this.categoryService.getParentCategories()

    res.status(200).json({
      success: true,
      data: categories
    } as ApiResponse<Category[]>)
  })

  // Get subcategories
  getSubcategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { parentId } = req.params
    
    if (!parentId) {
      throw new AppError('Parent category ID is required', 400)
    }
    
    const categories = await this.categoryService.getSubcategories(parentId)

    res.status(200).json({
      success: true,
      data: categories
    } as ApiResponse<Category[]>)
  })

  // Create category (admin only)
  createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const categoryData = req.body
    const category = await this.categoryService.createCategory(categoryData)

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    } as ApiResponse<Category>)
  })

  // Update category (admin only)
  updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const updates = req.body
    
    if (!id) {
      throw new AppError('Category ID is required', 400)
    }
    
    const category = await this.categoryService.updateCategory(id, updates)

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    } as ApiResponse<Category>)
  })

  // Delete category (admin only)
  deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    
    if (!id) {
      throw new AppError('Category ID is required', 400)
    }
    
    await this.categoryService.deleteCategory(id)

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    } as ApiResponse)
  })
}