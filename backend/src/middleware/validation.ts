import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'
import { AppError } from './error'

// Validation schemas
export const schemas = {
  // Auth schemas
  signup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('bidder', 'seller').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).required()
  }),

  // Seller auth schemas
  sellerSignup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    business_name: Joi.string().min(2).max(200).required(),
    business_type: Joi.string().valid('individual', 'company', 'partnership').required(),
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/).required(),
    business_address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().required(),
      country: Joi.string().required()
    }).required(),
    tax_id: Joi.string().optional(),
    role: Joi.string().valid('seller').default('seller')
  }),

  updateSellerProfile: Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    business_name: Joi.string().min(2).max(200).optional(),
    business_type: Joi.string().valid('individual', 'company', 'partnership').optional(),
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/).optional(),
    business_address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().required(),
      country: Joi.string().required()
    }).optional(),
    tax_id: Joi.string().optional(),
    avatar_url: Joi.string().uri().optional()
  }),

  verifyBusiness: Joi.object({
    business_license: Joi.string().uri().required(),
    tax_document: Joi.string().uri().optional(),
    identity_document: Joi.string().uri().required(),
    additional_documents: Joi.array().items(Joi.string().uri()).optional()
  }),

  // Seller dashboard schemas
  sellerListingsQuery: Joi.object({
    type: Joi.string().valid('products', 'auctions').optional(),
    status: Joi.string().valid('draft', 'active', 'inactive', 'completed', 'cancelled').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().max(100).optional()
  }),

  // Unified posting schemas
  createPosting: Joi.object({
    type: Joi.string().valid('product', 'auction').required(),
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    category_id: Joi.string().uuid().required(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    condition: Joi.string().valid('new', 'used', 'refurbished').required(),
    shipping_cost: Joi.number().min(0).required(),
    shipping_methods: Joi.array().items(Joi.string()).min(1).required(),
    // Product-specific fields
    price: Joi.when('type', { is: 'product', then: Joi.number().min(0.01).required(), otherwise: Joi.forbidden() }),
    stock_quantity: Joi.when('type', { is: 'product', then: Joi.number().integer().min(0).required(), otherwise: Joi.forbidden() }),
    // Auction-specific fields
    starting_price: Joi.when('type', { is: 'auction', then: Joi.number().min(0.01).required(), otherwise: Joi.forbidden() }),
    reserve_price: Joi.when('type', { is: 'auction', then: Joi.number().min(0.01).optional(), otherwise: Joi.forbidden() }),
    bid_increment: Joi.when('type', { is: 'auction', then: Joi.number().min(0.01).required(), otherwise: Joi.forbidden() }),
    start_time: Joi.when('type', { is: 'auction', then: Joi.date().iso().required(), otherwise: Joi.forbidden() }),
    end_time: Joi.when('type', { is: 'auction', then: Joi.date().iso().greater(Joi.ref('start_time')).required(), otherwise: Joi.forbidden() })
  }),

  updatePosting: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    category_id: Joi.string().uuid().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    condition: Joi.string().valid('new', 'used', 'refurbished').optional(),
    shipping_cost: Joi.number().min(0).optional(),
    shipping_methods: Joi.array().items(Joi.string()).min(1).optional(),
    price: Joi.number().min(0.01).optional(),
    stock_quantity: Joi.number().integer().min(0).optional(),
    starting_price: Joi.number().min(0.01).optional(),
    reserve_price: Joi.number().min(0.01).optional(),
    bid_increment: Joi.number().min(0.01).optional(),
    start_time: Joi.date().iso().optional(),
    end_time: Joi.date().iso().optional()
  }),

  updatePostingStatus: Joi.object({
    status: Joi.string().valid('draft', 'active', 'inactive', 'completed', 'cancelled').required()
  }),

  convertToAuction: Joi.object({
    starting_price: Joi.number().min(0.01).required(),
    reserve_price: Joi.number().min(0.01).optional(),
    bid_increment: Joi.number().min(0.01).required(),
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
  }),

  // Auction schemas
  createAuction: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    category_id: Joi.string().uuid().required(),
    starting_price: Joi.number().min(0.01).required(),
    reserve_price: Joi.number().min(0.01).optional(),
    bid_increment: Joi.number().min(0.01).required(),
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
    condition: Joi.string().valid('new', 'used', 'refurbished').required(),
    shipping_cost: Joi.number().min(0).required(),
    shipping_methods: Joi.array().items(Joi.string()).min(1).required(),
    images: Joi.array().items(Joi.string().uri()).optional()
  }),

  updateAuction: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    category_id: Joi.string().uuid().optional(),
    starting_price: Joi.number().min(0.01).optional(),
    reserve_price: Joi.number().min(0.01).optional(),
    bid_increment: Joi.number().min(0.01).optional(),
    start_time: Joi.date().iso().optional(),
    end_time: Joi.date().iso().optional(),
    condition: Joi.string().valid('new', 'used', 'refurbished').optional(),
    shipping_cost: Joi.number().min(0).optional(),
    shipping_methods: Joi.array().items(Joi.string()).min(1).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').optional()
  }),

  // Bidding schemas
  placeBid: Joi.object({
    auction_id: Joi.string().uuid().required(),
    amount: Joi.number().min(0.01).required(),
    is_auto_bid: Joi.boolean().optional(),
    max_auto_bid: Joi.number().min(0.01).optional()
  }).custom((value, helpers) => {
    if (value.is_auto_bid && (!value.max_auto_bid || value.max_auto_bid <= value.amount)) {
      return helpers.error('any.invalid')
    }
    return value
  }),

  // Search schemas
  searchAuctions: Joi.object({
    query: Joi.string().max(100).optional(),
    category: Joi.string().uuid().optional(),
    condition: Joi.string().valid('new', 'used', 'refurbished').optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    endingIn: Joi.string().valid('1h', '6h', '24h', '3d', '7d').optional(),
    sortBy: Joi.string().valid(
      'ending_soon', 
      'newly_listed', 
      'price_low', 
      'price_high', 
      'most_bids', 
      'most_watched'
    ).optional(),
    status: Joi.string().valid('draft', 'active', 'completed', 'cancelled').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  }).custom((value, helpers) => {
    if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
      return helpers.error('any.invalid')
    }
    return value
  }),

  // Profile schemas
  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-()]+$/).optional(),
    address: Joi.object().optional(),
    avatar_url: Joi.string().uri().optional()
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // UUID param schema
  uuidParam: Joi.object({
    id: Joi.string().uuid().required()
  })
}

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[target]
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    })

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ')
      
      next(new AppError(`Validation error: ${errorMessage}`, 400))
      return
    }

    // For query and params, we can't overwrite the original property
    // Instead, we'll store the validated data in a new property
    if (target === 'query') {
      (req as any).validatedQuery = value
    } else if (target === 'params') {
      (req as any).validatedParams = value
    } else {
      // For body, we can safely replace
      req[target] = value
    }
    
    next()
  }
}

// Common validation middlewares
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body')
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query')
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params')

// File upload validation
export const validateFileUpload = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      next()
      return
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file]

    for (const file of files) {
      if (!file) continue

      if (!allowedTypes.includes(file.mimetype)) {
        next(new AppError(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400))
        return
      }

      if (file.size > maxSize) {
        next(new AppError(`File size ${file.size} exceeds maximum size of ${maxSize} bytes`, 400))
        return
      }
    }

    next()
  }
}