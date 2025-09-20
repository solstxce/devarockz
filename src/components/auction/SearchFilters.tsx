import { useState } from 'react'
import { Search, X, SlidersHorizontal, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/lib/supabase'

interface SearchFiltersProps {
  categories: Category[]
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
  isLoading?: boolean
}

export interface SearchFilters {
  query: string
  category: string
  condition: string
  priceRange: { min: number; max: number }
  endingIn: string
  sortBy: string
  status: string
}

const initialFilters: SearchFilters = {
  query: '',
  category: '',
  condition: '',
  priceRange: { min: 0, max: 0 },
  endingIn: '',
  sortBy: 'ending_soon',
  status: 'active'
}

export function SearchFilters({ categories, onSearch, onReset, isLoading = false }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const searchFilters = {
      ...filters,
      priceRange: {
        min: priceMin ? parseFloat(priceMin) : 0,
        max: priceMax ? parseFloat(priceMax) : 0
      }
    }
    onSearch(searchFilters)
  }

  const handleReset = () => {
    setFilters(initialFilters)
    setPriceMin('')
    setPriceMax('')
    setShowAdvanced(false)
    onReset()
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query' || key === 'sortBy' || key === 'status') return false
    if (key === 'priceRange') return priceMin || priceMax
    return value
  }).length + (priceMin || priceMax ? 1 : 0)

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Search className="w-5 h-5" />
            <span>Search Auctions</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by title, description, or seller..."
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              {activeFiltersCount > 0 && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={filters.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: 'active' })}
            >
              Active Auctions
            </Button>
            <Button
              type="button"
              variant={filters.endingIn === '1h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, endingIn: '1h' })}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Ending Soon
            </Button>
            <Button
              type="button"
              variant={filters.condition === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, condition: 'new' })}
            >
              New Items
            </Button>
            <Button
              type="button"
              variant={filters.sortBy === 'price_low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, sortBy: 'price_low' })}
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Low Price
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={filters.condition}
                    onValueChange={(value) => setFilters({ ...filters, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ending Time */}
                <div>
                  <Label htmlFor="ending">Ending</Label>
                  <Select
                    value={filters.endingIn}
                    onValueChange={(value) => setFilters({ ...filters, endingIn: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Time</SelectItem>
                      <SelectItem value="1h">Next Hour</SelectItem>
                      <SelectItem value="6h">Next 6 Hours</SelectItem>
                      <SelectItem value="24h">Next 24 Hours</SelectItem>
                      <SelectItem value="3d">Next 3 Days</SelectItem>
                      <SelectItem value="7d">Next Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ending_soon">Ending Soon</SelectItem>
                      <SelectItem value="newly_listed">Newly Listed</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="most_bids">Most Bids</SelectItem>
                      <SelectItem value="most_watched">Most Watched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label>Price Range</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min Price"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max Price"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Category: {categories.find(c => c.id === filters.category)?.name}</span>
                  <button 
                    onClick={() => setFilters({ ...filters, category: '' })}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.condition && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Condition: {filters.condition}</span>
                  <button 
                    onClick={() => setFilters({ ...filters, condition: '' })}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {(priceMin || priceMax) && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>
                    Price: ${priceMin || '0'} - ${priceMax || '∞'}
                  </span>
                  <button 
                    onClick={() => { setPriceMin(''); setPriceMax('') }}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.endingIn && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Ending: {filters.endingIn}</span>
                  <button 
                    onClick={() => setFilters({ ...filters, endingIn: '' })}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}