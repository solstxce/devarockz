import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSellerAuth } from '@/hooks/useSellerAuth'
import { Store, MapPin, Globe, Star, Shield, Edit, Save, X, Camera, Upload } from 'lucide-react'

interface BusinessAddress {
  street: string
  city: string
  state: string
  zip_code: string
  country: string
}

interface SellerProfile {
  business_name: string
  business_type: string
  description: string
  phone: string
  website?: string
  business_address: BusinessAddress
  verification_status: 'pending' | 'verified' | 'rejected'
  profile_image?: string
  cover_image?: string
  rating: number
  total_reviews: number
  member_since: string
}

export function SellerProfilePage() {
  const { getSellerUser } = useSellerAuth()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [formData, setFormData] = useState<Partial<SellerProfile>>({})
  const [sellerAuth, setSellerAuth] = useState<ReturnType<typeof getSellerUser>>(null)

  useEffect(() => {
    // Get seller auth state
    const auth = getSellerUser()
    setSellerAuth(auth)
    
    if (auth) {
      const fetchProfile = async () => {
        setLoading(true)
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500))

          // Mock profile data using actual auth data
          const mockProfile: SellerProfile = {
            business_name: auth.profile.business_name || 'Premium Auctions',
            business_type: auth.profile.business_type || 'individual',
            description: 'Specializing in vintage collectibles, antiques, and rare items. With over 10 years of experience in the auction industry, we provide authentic items with detailed provenance.',
            phone: auth.profile.phone || '+1 (555) 123-4567',
            website: 'https://premiumauctions.com',
            business_address: auth.profile.business_address || {
              street: '123 Auction Street',
              city: 'New York',
              state: 'NY',
              zip_code: '10001',
              country: 'United States'
            },
            verification_status: auth.profile.verification_status || 'verified',
            profile_image: '/api/placeholder/150/150',
            cover_image: '/api/placeholder/800/200',
            rating: 4.8,
            total_reviews: 156,
            member_since: auth.user.created_at ? new Date(auth.user.created_at).toLocaleDateString() : '2023'
          }

          setProfile(mockProfile)
          setFormData(mockProfile)
        } catch (error) {
          console.error('Error fetching profile:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchProfile()
    }
  }, [getSellerUser])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setProfile(formData as SellerProfile)
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setEditing(false)
  }

  const updateFormData = (field: string, value: string | BusinessAddress) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateAddressField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      business_address: {
        ...prev.business_address!,
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!sellerAuth || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
          <p className="text-sm text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end space-x-4">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full p-1">
                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-gray-600" />
                </div>
              </div>
              <Button
                size="sm"
                className="absolute bottom-0 right-0 w-8 h-8 p-0 rounded-full"
                variant="secondary"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-bold text-white">{profile.business_name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                  {profile.verification_status === 'verified' ? (
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Verified Seller</span>
                    </div>
                  ) : (
                    'Pending Verification'
                  )}
                </Badge>
                <div className="flex items-center space-x-1 text-white text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{profile.rating}</span>
                  <span>({profile.total_reviews} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Business Profile</h2>
            <p className="text-gray-600 mt-1">Member since {profile.member_since}</p>
          </div>
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  <span>Business Information</span>
                </CardTitle>
                <CardDescription>
                  Basic details about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    {editing ? (
                      <Input
                        id="business_name"
                        value={formData.business_name || ''}
                        onChange={(e) => updateFormData('business_name', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.business_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="business_type">Business Type</Label>
                    {editing ? (
                      <Select
                        value={formData.business_type || ''}
                        onValueChange={(value) => updateFormData('business_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="nonprofit">Non-profit</SelectItem>
                          <SelectItem value="government">Government</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm font-medium capitalize">{profile.business_type}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Business Description</Label>
                  {editing ? (
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      rows={4}
                      placeholder="Tell buyers about your business..."
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-700">{profile.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    {editing ? (
                      <Input
                        id="website"
                        value={formData.website || ''}
                        onChange={(e) => updateFormData('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">
                        {profile.website ? (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.website}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>Business Address</span>
                </CardTitle>
                <CardDescription>
                  Your business location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    {editing ? (
                      <Input
                        id="street"
                        value={formData.business_address?.street || ''}
                        onChange={(e) => updateAddressField('street', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.business_address.street}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    {editing ? (
                      <Input
                        id="city"
                        value={formData.business_address?.city || ''}
                        onChange={(e) => updateAddressField('city', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.business_address.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    {editing ? (
                      <Input
                        id="state"
                        value={formData.business_address?.state || ''}
                        onChange={(e) => updateAddressField('state', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.business_address.state}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    {editing ? (
                      <Input
                        id="zip_code"
                        value={formData.business_address?.zip_code || ''}
                        onChange={(e) => updateAddressField('zip_code', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.business_address.zip_code}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    {editing ? (
                      <Input
                        id="country"
                        value={formData.business_address?.country || ''}
                        onChange={(e) => updateAddressField('country', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium">{profile.business_address.country}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification</span>
                  <Badge variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                    {profile.verification_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{profile.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reviews</span>
                  <span className="text-sm font-medium">{profile.total_reviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm font-medium">{profile.member_since}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Request Verification
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Public Profile
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Help Center
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Seller Guidelines
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}