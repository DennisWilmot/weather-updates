import { z } from 'zod';

// Business type options (legal structure)
export const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'LLC',
  'Corporation',
] as const;

// Business category/industry options
export const BUSINESS_CATEGORIES = [
  'Agriculture',
  'Construction',
  'Retail',
  'Wholesale',
  'Hospitality',
  'Food Services',
  'Transportation',
  'Manufacturing',
  'Health',
  'Wellness',
  'Beauty',
  'Automotive',
  'Technology',
  'Communications',
  'Education',
  'Professional Services',
  'Finance',
  'Utilities',
  'Infrastructure',
  'Creative Industries',
  'Entertainment',
  'Community Services',
] as const;

// TypeScript interface
export interface MerchantOnboardingFormSchema {
  // Business Information
  businessName: string;
  tradingName?: string;
  businessType: string;
  businessCategory: string;
  
  // Location
  parishId: string; // UUID reference to parishes.id
  communityId: string; // UUID reference to communities.id
  streetAddress: string;
  gpsPin?: string; // Optional GPS pin/plus code
  latitude?: number;
  longitude?: number;
  
  // Contact Details
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  
  // Inventory (Step 2)
  productCategories: string[]; // Main product categories
  topItems: Array<{
    itemName: string;
    unit: string;
    price: number;
  }>;
  wantsFullInventoryUpload: boolean; // Yes/No for full inventory upload
  
  // Business Capacity & Quotation (Step 3)
  monthlySalesVolume?: number; // Monthly sales volume in JMD
  numberOfEmployees?: number; // Number of employees
  issuesInvoices: boolean; // Does your business issue invoices? (required)
  acceptsDigitalPayments: boolean; // Do you accept digital payments? (required)
  
  // Utilities & Connectivity
  hasElectricity: boolean; // Do you have electricity? (required)
  hasInternetAccess: boolean; // Do you have internet access? (required)
  hasSmartphone: boolean; // Do you have a smartphone? (required)
  
  // Import Interest & Purchasing
  revenueAllocationPercentage?: number; // Percentage of monthly revenue for bulk imports (0-100)
  estimatedMonthlyPurchaseAmount: number; // Estimated monthly purchase amount in JMD (required)
  interestedImportProducts: string[]; // Products interested in importing (multi-select)
  
  // Verification Photos
  shopfrontPhotoUrl?: string;
  documentPhotoUrl?: string;
  invoicePhotoUrl?: string;
  
  // Consent & Agreement
  consent: boolean; // Required consent checkbox
  
  // Additional Notes
  notes?: string;
  
  // Metadata
  submittedBy: string; // User ID
}

// Zod validation schema
export const merchantOnboardingSchema = z.object({
  // Business Information
  businessName: z.string().min(1, 'Business name is required'),
  tradingName: z.string().optional(),
  businessType: z.string().min(1, 'Business type is required'),
  businessCategory: z.string().min(1, 'Business category is required'),
  
  // Location
  parishId: z.string().uuid('Invalid parish ID'),
  communityId: z.string().uuid('Invalid community ID'),
  streetAddress: z.string().min(1, 'Street address is required'),
  gpsPin: z.string().optional(),
  latitude: z.number()
    .min(17.7, 'Latitude must be within Jamaica bounds')
    .max(18.5, 'Latitude must be within Jamaica bounds')
    .optional(),
  longitude: z.number()
    .min(-78.5, 'Longitude must be within Jamaica bounds')
    .max(-76.2, 'Longitude must be within Jamaica bounds')
    .optional(),
  
  // Contact Details
  ownerName: z.string().min(1, 'Owner name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  alternatePhone: z.string().optional(),
  email: z.union([
    z.string().email('Invalid email format'),
    z.literal(''),
  ]).optional(),
  
  // Inventory (Step 2)
  productCategories: z.array(z.string()).min(1, 'At least one product category must be selected'),
  topItems: z.array(z.object({
    itemName: z.string().min(1, 'Item name is required'),
    unit: z.string().min(1, 'Unit is required'),
    price: z.number().positive('Price must be a positive number'),
  })).max(10, 'Maximum 10 items allowed'),
  wantsFullInventoryUpload: z.boolean(),
  
  // Business Capacity & Quotation (Step 3)
  monthlySalesVolume: z.number().positive('Monthly sales volume must be a positive number').optional(),
  numberOfEmployees: z.number().int().positive('Number of employees must be a positive integer').optional(),
  issuesInvoices: z.boolean(),
  acceptsDigitalPayments: z.boolean(),
  
  // Utilities & Connectivity
  hasElectricity: z.boolean(),
  hasInternetAccess: z.boolean(),
  hasSmartphone: z.boolean(),
  
  // Import Interest & Purchasing
  revenueAllocationPercentage: z.number().min(0, 'Percentage must be between 0 and 100').max(100, 'Percentage must be between 0 and 100').optional(),
  estimatedMonthlyPurchaseAmount: z.number().positive('Estimated monthly purchase amount is required'),
  interestedImportProducts: z.array(z.string()),
  
  // Verification Photos (optional)
  shopfrontPhotoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  documentPhotoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  invoicePhotoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // Consent & Agreement
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to the terms and conditions',
  }),
  
  // Additional Notes
  notes: z.string().optional(),
  
  // Metadata
  submittedBy: z.string().optional(), // Optional for public submissions
});

// Type inference from Zod schema
export type MerchantOnboardingForm = z.infer<typeof merchantOnboardingSchema>;

