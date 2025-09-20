import { apiClient, type ApiResponse } from '@/lib/api'
import type { Category, Auction } from '@/lib/supabase'

export interface CreateCategoryData {
  name: string
  description: string
  parentId?: string
}

class CategoryService {
  // Get all categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return await apiClient.get<Category[]>('/categories')
  }

  // Get a single category by ID
  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return await apiClient.get<Category>(`/categories/${id}`)
  }

  // Create a new category
  async createCategory(data: CreateCategoryData): Promise<ApiResponse<Category>> {
    return await apiClient.post<Category>('/categories', data)
  }

  // Update a category
  async updateCategory(id: string, data: Partial<CreateCategoryData>): Promise<ApiResponse<Category>> {
    return await apiClient.put<Category>(`/categories/${id}`, data)
  }

  // Delete a category
  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/categories/${id}`)
  }

  // Join category room for real-time updates
  joinCategoryRoom(categoryId: string): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.emit('join_category', categoryId)
    }
  }

  // Leave category room
  leaveCategoryRoom(categoryId: string): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.emit('leave_category', categoryId)
    }
  }

  // Subscribe to category updates
  onCategoryUpdate(categoryId: string, callback: (category: Category) => void): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.on(`category_updated_${categoryId}`, callback)
    }
  }

  // Subscribe to new auctions in category
  onNewAuctionInCategory(categoryId: string, callback: (auction: Auction) => void): void {
    const socket = apiClient.getSocket()
    if (socket) {
      socket.on(`auction_created_in_category_${categoryId}`, callback)
    }
  }
}

export const categoryService = new CategoryService()