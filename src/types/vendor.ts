// types/vendor.ts

export interface InventoryItem {
  id: string;
  item: string; // single string item name
}

export interface LifetimeVendor {
  id: string;
  name: string;
  contact: string;
  top5Items: string[];
  moq: number;
  address: string;
  paymentTime: string;    // dataType changed
  lastDealDate: string;   // dataType changed
  deliveryTime: string;   // dataType changed
  vendorRating: number;
  relationship: string;   // 1 to 5 rating
}

export interface DailyVendor {
  id: string;
  name: string;
  party: string;  // new field
  contact: string;       
  itemName: string;
  itemRate: number;
  itemQuantity: number;  // new field
  unitOfMeasurement: string;  
  lastDealDate: string;         
  paymentTime: string;  // dataType changed
  itemQuality: string;    
  offerTime: string;      
  deliveryTime: string;   // dataType changed
  trustLevel: number;     // new field
}

// 👇 now support 3 types
export type VendorType = 'inventory' | 'lifetime' | 'daily';

export interface VendorFilters {
  searchQuery: string;
  ratingFilter?: number;
  paymentTimeFilter?: string;
  unitFilter?: string;
  paymentDate?: Date;
}
