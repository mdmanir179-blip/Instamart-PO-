export type UserRole = 'admin' | 'Backoffice' | 'Warehouse';

export type Department = 
  | 'Admin Team' 
  | 'Backoffice Team' 
  | 'Warehouse Team' 
  | 'Logistics Team' 
  | 'Print Team';

export type ThemeMode = 'light' | 'grey' | 'dark';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  employeeId: string;
  role: UserRole;
  department?: Department;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface ItemMaster {
  id: string;
  itemId: string;
  itemName: string;
  category?: string;
  unit?: string;
  createdAt?: string;
  updatedBy?: string;
}

export interface POItem {
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice?: number;
  boxCount?: number;
  expiryDate?: string;
  remark?: string;
}

export type POStatus = 'New PO' | 'In Transit' | 'Inwarded' | 'GRN Completed' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  warehouseName: string;
  items: POItem[];
  totalQty: number;
  invoiceNo: string;
  shipDate: string;
  appointmentId: string;
  appointmentDate: string;
  expiryDate?: string;
  so: string;
  status: POStatus;
  noOfBoxes: number;
  boxDimensions: string;
  logisticsPortal: string;
  pickupTrackingId: string;
  puc: string;
  asn: string;
  clearBagNo: string;
  comment: string;
  pickupStatus: 'YES' | 'NO';
  hasDN?: boolean;
  grnNumber?: string;
  grnDate?: string;
  createdBy: string;
  createdByName: string;
  createdByEmpId: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedByEmpId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DNRecord {
  id: string;
  dnDate: string;
  dnNumber: string;
  facilityName: string;
  parentPoNumber: string;
  parentPoDate?: string;
  parentSo?: string;
  skuId: string;
  itemName: string;
  dnQty: number;
  whPocName: string;
  whPocContact: string;
  fileName?: string;
  fileSize?: number;
  fileData?: string; // Base64 data URI
  fileType?: string;
  lrNo: string;
  trackingNo?: string;
  status: 'Pending' | 'Accepted' | 'Dispatched' | 'Closed';
  acceptedAt?: string;
  acceptedBy?: string;
  createdBy: string;
  createdByName: string;
  createdByEmpId: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedByEmpId?: string;
  createdAt: string;
  updatedAt: string;
}
