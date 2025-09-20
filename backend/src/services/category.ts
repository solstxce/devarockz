import { supabase } from './database'
import type { Category, ApiResponse } from '@/types'

export class CategoryService {
  private static instance: CategoryService

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService()
    }
    return CategoryService.instance
  }

  // Get all active categories
  async getAllCategories(): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return categories || []
  }

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<Category | null> {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (error || !category) {
      return null
    }

    return category
  }

  // Get categories with auction counts
  async getCategoriesWithCounts(): Promise<Array<Category & { auction_count: number }>> {
    const { data: categories, error } = await supabase
      .rpc('get_categories_with_counts')

    if (error) {
      throw new Error(error.message)
    }

    return categories || []
  }

  // Create new category (admin only)
  async createCategory(categoryData: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    if (error || !category) {
      throw new Error(error?.message || 'Failed to create category')
    }

    return category
  }

  // Update category (admin only)
  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single()

    if (error || !category) {
      throw new Error(error?.message || 'Failed to update category')
    }

    return category
  }

  // Delete category (admin only)
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      throw new Error(error.message)
    }
  }

  // Get parent categories (top-level)
  async getParentCategories(): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return categories || []
  }

  // Get subcategories by parent ID
  async getSubcategories(parentId: string): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return categories || []
  }
}