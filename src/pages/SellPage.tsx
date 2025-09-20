import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import { categoryService } from '@/services/categoryService'
import { Plus, Image, DollarSign, Clock, Tag, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Category } from '@/lib/supabase'

export function SellPage() {
  const { user } = useAuth()
  const { getSellerUser } = useSellerAuth()
  const sellerAuth = getSellerUser()
  const navigate = useNavigate()

  const isAuthenticated = !!(user || sellerAuth)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    minIncrement: '',
    duration: '',
    condition: 'new',
    shippingCost: '0',
    shippingMethods: ['standard'],
    images: [] as File[]
  })

  // Get authentication token
  const getAuthToken = () => {
    if (sellerAuth) {
      return localStorage.getItem('seller_token')
    } else if (user) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await categoryService.getCategories()
        if (response.success && response.data) {
          setCategories(response.data)
        } else {
          console.error('Failed to fetch categories:', response.error)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length + formData.images.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    const newImages = [...formData.images, ...files]
    setFormData(prev => ({ ...prev, images: newImages }))

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  // Remove image
  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)

    setFormData(prev => ({ ...prev, images: newImages }))
    setImagePreviewUrls(newPreviewUrls)
  }

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' }
  ]

  const shippingOptions = [
    { value: 'standard', label: 'Standard Shipping' },
    { value: 'express', label: 'Express Shipping' },
    { value: 'overnight', label: 'Overnight Shipping' },
    { value: 'pickup', label: 'Local Pickup' }
  ]

  const durations = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '5', label: '5 Days' },
    { value: '7', label: '7 Days' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!formData.category) {
        throw new Error('Category is required')
      }
      if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
        throw new Error('Valid starting price is required')
      }
      if (!formData.minIncrement || parseFloat(formData.minIncrement) <= 0) {
        throw new Error('Valid minimum increment is required')
      }
      if (!formData.duration) {
        throw new Error('Duration is required')
      }

      // Find category by ID
      const selectedCategory = categories.find(cat => cat.id === formData.category)
      if (!selectedCategory) {
        throw new Error('Invalid category selected')
      }

      // Calculate start and end times
      const startTime = new Date()
      const endTime = new Date(Date.now() + (parseInt(formData.duration) * 24 * 60 * 60 * 1000))

      // Create FormData for file upload
      const auctionData = new FormData()
      auctionData.append('title', formData.title.trim())
      auctionData.append('description', formData.description.trim())
      auctionData.append('category_id', selectedCategory.id)
      auctionData.append('starting_price', formData.startingPrice)
      auctionData.append('bid_increment', formData.minIncrement)
      auctionData.append('start_time', startTime.toISOString())
      auctionData.append('end_time', endTime.toISOString())
      auctionData.append('condition', formData.condition)
      auctionData.append('shipping_cost', formData.shippingCost)
      auctionData.append('shipping_methods', JSON.stringify(formData.shippingMethods))

      // Append images - multer expects field name 'images' for array
      formData.images.forEach((image) => {
        auctionData.append('images', image)
      })

      console.log('Creating auction:', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startingPrice: formData.startingPrice,
        minIncrement: formData.minIncrement,
        duration: formData.duration,
        images: formData.images.length
      })

      // Simulate API call with progress
      const simulateProgress = () => {
        setUploadProgress(0)
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval)
              return prev
            }
            return prev + 10
          })
        }, 200)
        return interval
      }

      const progressInterval = simulateProgress()

      // Make API call to create auction
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: auctionData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create auction')
      }

      console.log('Auction created successfully:', result)

      // Show success message
      toast.success('Auction created successfully!')
      setSuccess(true)

      // Redirect to dashboard or auction page after delay
      setTimeout(() => {
        if (sellerAuth) {
          navigate('/seller/dashboard')
        } else {
          navigate('/dashboard')
        }
      }, 2000)

    } catch (error) {
      console.error('Error creating auction:', error)
      setError(error instanceof Error ? error.message : 'Failed to create auction')
      toast.error(error instanceof Error ? error.message : 'Failed to create auction')
    } finally {
      setLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to create an auction listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/login">
              <Button className="w-full">Sign In as Buyer</Button>
            </Link>
            <Link to="/seller/login">
              <Button variant="outline" className="w-full">Sign In as Seller</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Auction</h1>
          <p className="text-gray-600">List your item and start receiving bids</p>
          {sellerAuth && (
            <Badge variant="default" className="mt-2">
              Seller Account
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>
                  Provide detailed information about your item
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Error and Success Messages */}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Auction created successfully! Redirecting...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Upload Progress */}
                {uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Creating auction...</span>
                      <span className="text-sm font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Item Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title for your item"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail, including condition, features, etc."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startingPrice">Starting Price ($) *</Label>
                      <Input
                        id="startingPrice"
                        type="number"
                        placeholder="0.00"
                        value={formData.startingPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value }))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minIncrement">Minimum Increment ($) *</Label>
                      <Input
                        id="minIncrement"
                        type="number"
                        placeholder="1.00"
                        value={formData.minIncrement}
                        onChange={(e) => setFormData(prev => ({ ...prev, minIncrement: e.target.value }))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Auction Duration *</Label>
                    <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value}>
                            {duration.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Condition */}
                  <div className="space-y-2">
                    <Label htmlFor="condition">Item Condition *</Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value as 'new' | 'used' | 'refurbished' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shipping */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCost">Shipping Cost ($) *</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        placeholder="0.00"
                        value={formData.shippingCost}
                        onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingMethods">Shipping Methods *</Label>
                      <Select
                        value={formData.shippingMethods[0]}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, shippingMethods: [value] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shipping method" />
                        </SelectTrigger>
                        <SelectContent>
                          {shippingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-2">
                    <Label>Images (Max 5)</Label>

                    {/* Image Previews */}
                    {imagePreviewUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={formData.images.length >= 5}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                          {formData.images.length === 0
                            ? 'Drag and drop images here or click to browse'
                            : `${formData.images.length}/5 images uploaded`
                          }
                        </p>
                        {formData.images.length < 5 && (
                          <Button type="button" variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Images
                          </Button>
                        )}
                      </label>
                    </div>
                    {formData.images.length >= 5 && (
                      <p className="text-sm text-gray-500">Maximum number of images reached</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Auction...
                      </div>
                    ) : success ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Created Successfully!
                      </div>
                    ) : (
                      'Create Auction'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Real-time Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <CardDescription>How your auction will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {imagePreviewUrls.length > 0 ? (
                        <img
                          src={imagePreviewUrls[0]}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">
                        {formData.title || 'Item Title'}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {formData.description ? formData.description.substring(0, 80) + '...' : 'Item description will appear here...'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-green-600">
                          ${formData.startingPrice || '0'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {formData.category || 'No Category'}
                          </Badge>
                          {formData.condition && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {formData.condition}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.title ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Title (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.description ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Description (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.category ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Category (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.startingPrice ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Starting Price (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.minIncrement ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Bid Increment (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.duration ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Duration (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.condition ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Condition (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.shippingCost ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Shipping Cost (required)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.images.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">At least 1 image (recommended)</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selling Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Tag className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Descriptive Title</p>
                    <p className="text-sm text-gray-600">Include brand, model, and key features</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Image className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Quality Photos</p>
                    <p className="text-sm text-gray-600">Show all angles and any imperfections</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Competitive Pricing</p>
                    <p className="text-sm text-gray-600">Research similar items for pricing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Optimal Timing</p>
                    <p className="text-sm text-gray-600">End auctions when buyers are active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Listing Fee</span>
                  <Badge variant="outline" className="text-xs">Free</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Final Value Fee</span>
                  <Badge variant="outline" className="text-xs">5%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Payment Processing</span>
                  <Badge variant="outline" className="text-xs">2.9% + $0.30</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}