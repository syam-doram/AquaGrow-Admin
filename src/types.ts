// ─── Core Users ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'provider' | 'farmer';
  avatar?: string;
  permissions?: string[];
  walletBalance?: number;
  creditScore?: number;
}

// ─── Farmer ───────────────────────────────────────────────────────────────────
export interface Farmer {
  id: string;
  name: string;
  location: string;
  phone?: string;
  assignedProviderId?: string;
  status: 'active' | 'inactive' | 'pending' | 'flagged' | 'suspended';
  registrationStatus: 'approved' | 'pending' | 'rejected';
  totalOrders: number;
  joinedAt: string;
  rating: number;
  creditScore: number;
  totalPonds: number;
  trustedFarmer?: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  subscriptionPlanId?: string;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  rating: number;
  location: string;
  regions: string[];
  status: 'verified' | 'pending' | 'rejected' | 'disabled';
  performanceScore: number;
  assignedFarmersCount: number;
  activeOrdersCount: number;
  verificationBadge?: boolean;
  commissionRate?: number;      // % of order value
  subscriptionModel?: 'free' | 'premium' | 'verified';
  phone?: string;
  services?: string[];
  availability?: 'available' | 'busy' | 'unavailable';
  joiningDate?: string;
  assignedArea?: string; // district/mandal
  internalRole?: 'FIELD_TECH' | 'SALES_EXEC' | 'IOT_SPEC' | 'FIELD_OFFICER';
  appAccessLevel?: 'SALES' | 'TECHNICAL' | 'GENERAL' | 'ADMIN';
  totalSalesGenerated?: number;
  totalOnboardingCount?: number;
  totalInstallationCount?: number;
}

export type ProviderCategory =
  | 'Aqua Consultant'
  | 'Feed Supplier'
  | 'Medicine Supplier'
  | 'Technician'
  | 'Shrimp Logistics'
  | 'Organic Grains'
  | 'Bulk Grains'
  | 'Sustainable Veggies'
  | 'Root Vegetables'
  | 'Date Palms'
  | string;

// ─── Pond ─────────────────────────────────────────────────────────────────────
export interface Pond {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  sizeInAcres: number;
  species: string;
  stockingDensity: number; // per sq meter
  stockingDate: string;
  expectedHarvestDate: string;
  feedUsage: number; // kg
  mortalityRate: number; // %
  survivalRate: number; // %
  status: 'ACTIVE' | 'HARVESTED' | 'ALERT' | 'DISEASE_DETECTED' | 'EMPTY';
  waterQuality?: {
    ph: number;
    dissolvedOxygen: number;
    temperature: number;
    salinity: number;
    ammonia: number;
    recordedAt: string;
  };
  lastAiAnalysis?: {
    timestamp: string;
    result: string;
    confidence: number;
  };
  currentDoc?: number; // Day of Culture
  estimatedWeight?: number; // grams per piece
  region?: string;
}

// ─── Daily Log ────────────────────────────────────────────────────────────────
export interface DailyLog {
  id: string;
  farmerId: string;
  farmerName: string;
  pondId: string;
  pondName: string;
  date: string;
  feedGiven: number; // kg
  mortalityCount: number;
  waterPh: number;
  dissolvedOxygen: number;
  temperature: number;
  notes?: string;
  status: 'submitted' | 'missing' | 'flagged';
  submittedAt?: string;
  isAbnormal?: boolean;
  abnormalReason?: string;
}

// ─── Harvest ─────────────────────────────────────────────────────────────────────────────────
export type HarvestStage = 'REQUESTED' | 'APPROVED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'RISK_HARVEST';
export type HarvestType = 'TOTAL' | 'PARTIAL';

export interface HarvestProviderAssignment {
  providerId: string; providerName: string;
  role: 'Harvest Technician' | 'Labor Team' | 'Transport' | 'Quality Tester';
  assignedAt: string; status: 'ASSIGNED' | 'CONFIRMED' | 'ON_SITE' | 'DONE';
}

export interface HarvestQualityCheck {
  sizeCount: number; avgWeight: number; grade: 'A' | 'B' | 'C' | 'Reject';
  healthCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  inspectorName?: string; certificateGenerated: boolean; reportedAt?: string;
}

export interface HarvestBuyerOffer {
  id: string; buyerId: string; buyerName: string; pricePerKg: number;
  quantityKg: number; terms: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED'; offeredAt: string;
}

export interface Harvest {
  id: string; farmerId: string; farmerName: string; pondId: string; pondName: string;
  species: string; harvestType: HarvestType; requestDate: string; scheduledDate?: string;
  harvestDate?: string; estimatedQuantity: number; actualQuantity?: number;
  quality: 'A' | 'B' | 'C' | 'Reject'; shrimpCount: number; status: HarvestStage;
  isPartialHarvest: boolean; remainingStockKg?: number; pricePerKg?: number;
  finalPricePerKg?: number; totalValue?: number; commission?: number;
  notes?: string; verifiedBy?: string; riskFlag?: string;
  preHarvestChecks?: { logsComplete: boolean; waterQualityStable: boolean; noMajorAlerts: boolean; certificationEligible: boolean; growthStageReady: boolean; };
  providerAssignments?: HarvestProviderAssignment[];
  qualityCheck?: HarvestQualityCheck;
  buyerOffers?: HarvestBuyerOffer[];
  confirmedBuyerId?: string; confirmedBuyerName?: string; dealLockedAt?: string;
  advancePaid?: boolean; advanceAmount?: number;
  transportProviderName?: string; trackingNumber?: string;
  deliveryStatus?: 'NOT_DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  paymentStatus?: 'PENDING' | 'ADVANCE_RECEIVED' | 'PAID' | 'OVERDUE';
  farmerPaidAt?: string; certificationId?: string; createdAt: string; updatedAt: string;
}

export interface HarvestDispute {
  id: string; harvestId: string; farmerName: string; buyerName: string;
  type: 'QUALITY_MISMATCH' | 'QUANTITY_DISPUTE' | 'PAYMENT_DELAY' | 'OTHER';
  description: string; status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  resolution?: string; createdAt: string;
}

// ─── Certification ────────────────────────────────────────────────────────────
export interface Certification {
  id: string;
  farmerId: string;
  farmerName: string;
  type: 'TRUSTED_FARMER' | 'ORGANIC' | 'QUALITY_ASSURED' | 'PREMIUM_PRODUCER';
  status: 'ELIGIBLE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  appliedAt: string;
  reviewedAt?: string;
  validUntil?: string;
  reviewedBy?: string;
  notes?: string;
  criteria?: { label: string; met: boolean }[];
}

// ─── IoT Device ───────────────────────────────────────────────────────────────
export interface IoTDevice {
  id: string;
  name: string;
  type: 'AERATOR' | 'OXYGEN_SENSOR' | 'WATER_SENSOR' | 'POWER_METER' | 'CAMERA' | 'FEEDER';
  farmerId: string;
  farmerName: string;
  pondId: string;
  pondName: string;
  status: 'ONLINE' | 'OFFLINE' | 'FAULT' | 'MAINTENANCE';
  batteryLevel?: number;
  lastSeen: string;
  autoMode?: boolean;
  currentValue?: string; // e.g. "4.2 mg/L" for O2 sensor
  ipAddress?: string;
  installDate: string;
}

// ─── Subscription Plan ────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // monthly
  yearlyPrice: number;
  targetRole: 'farmer' | 'provider' | 'both';
  features: PlanFeature[];
  limits: {
    ponds: number;          // -1 = unlimited
    dailyLogs: number;
    iotDevices: number;
    harvestEntries: number;
    providerAccess: boolean;
    certifications: boolean;
    analytics: boolean;
    prioritySupport: boolean;
  };
  color: string;
  isPopular?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

// ─── Farmer Subscription ──────────────────────────────────────────────────────
export interface FarmerSubscription {
  id: string;
  farmerId: string;
  farmerName: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'GRACE_PERIOD' | 'CANCELLED';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: 'UPI' | 'CARD' | 'CASH' | 'OFFLINE';
  amountPaid: number;
  usagePonds: number;
  usageLogs: number;
  usageDevices: number;
  lastPaymentDate?: string;
}

// ─── Knowledge Base / FAQ ───────────────────────────────────────────────────
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  lastUpdated: string;
}

// ─── Content Item ─────────────────────────────────────────────────────────────
export interface ContentItem {
  id: string;
  title: string;
  type: 'GUIDE' | 'ALERT' | 'VIDEO' | 'TRAINING' | 'ANNOUNCEMENT';
  category: string;
  summary: string;
  content: string;
  targetAudience: 'all' | 'farmers' | 'providers';
  publishedAt: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  views?: number;
  tags?: string[];
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  farmerId: string;
  farmerName: string;
  providerId: string;
  providerName: string;
  status: 'PENDING_PROVIDER' | 'SENT_TO_COMPANY' | 'ADMIN_APPROVED' | 'REJECTED' | 'COMPLETED';
  items: { type: string; quantity: number; unit: string }[];
  farmerPrice: number;
  companyPrice: number;
  marketPriceSuggestion?: number;
  buyerId?: string;
  buyerName?: string;
  location: string;
  createdAt: string;
  adminApproval?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: string;
    finalPrice: number;
    notes?: string;
  };
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: 'PAYMENT' | 'COMMISSION' | 'WALLET_TOPUP' | 'SUBSCRIPTION' | 'REFUND';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  fromId: string;
  toId: string;
  orderId?: string;
  description?: string;
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  type: 'order' | 'system' | 'market' | 'disease' | 'water_quality' | 'weather' | 'government' | 'iot' | 'log_missing';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  region?: string;
  targetAudience?: 'all' | 'farmers' | 'providers';
  isRead?: boolean;
  farmerId?: string;
  pondId?: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  title: string;
  type: 'SMS' | 'PUSH' | 'BANNER' | 'WHATSAPP';
  status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  targetRegion: string;
  targetAudience: 'all' | 'farmers' | 'providers';
  message: string;
  sentCount: number;
  createdAt: string;
}

// ─── Price Setting ────────────────────────────────────────────────────────────
export interface PriceSetting {
  id: string;
  cropType: string;
  count: number;
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY';
  location: string;
  pricePerKg: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

// ─── Buyer Company ──────────────────────────────────────────────────────
export type BuyerType = 'Wholesaler' | 'Exporter' | 'Local Trader' | 'Retailer' | 'Processor';
export type BuyerVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type BuyerSegment = 'high-value' | 'frequent' | 'exporter' | 'inactive' | 'new';

export interface BuyerCompany {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  location: string;
  state?: string;
  buyerType: BuyerType;
  preferredSpecies?: string;
  licenseNumber?: string;
  gstNumber?: string;
  baseRate: number;
  demand: number;
  rating: number;
  paymentSpeed: 'FAST' | 'AVERAGE' | 'SLOW';
  status: 'active' | 'inactive' | 'suspended';
  verificationStatus: BuyerVerificationStatus;
  segment: BuyerSegment;
  isVerifiedBadge: boolean;
  otpVerified: boolean;
  notes?: string;
  totalDealsCompleted: number;
  totalSpent: number;
  commissionRate: number;
  activeOrders: number;
  lastActiveAt?: string;
  joinedAt: string;
}

export interface BuyerDeal {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  species: string;
  quantityKg: number;
  pricePerKg: number;
  totalValue: number;
  commission: number;
  status: 'NEGOTIATING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'DISPUTED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'ADVANCE_PAID' | 'PAID' | 'OVERDUE';
  deliveryDate?: string;
  createdAt: string;
}

export interface BuyerPurchaseRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  species: string;
  quantityKg: number;
  sizeCount: string;
  qualityGrade: 'A' | 'B' | 'C';
  maxPricePerKg: number;
  preferredLocation: string;
  status: 'OPEN' | 'MATCHED' | 'CLOSED';
  matchedFarmerId?: string;
  matchedFarmerName?: string;
  createdAt: string;
}

export interface BuyerDispute {
  id: string;
  buyerId: string;
  buyerName: string;
  dealId: string;
  reportedBy: 'farmer' | 'buyer' | 'admin';
  issue: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  action?: 'WARNING' | 'SUSPENSION' | 'BAN';
  createdAt: string;
}

// ─── Logistics ────────────────────────────────────────────────────────────────
export interface LogisticsEntry {
  id: string;
  orderId: string;
  truckId: string;
  driverName: string;
  status: 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'COLD_STORAGE';
  currentLocation: string;
  temperature?: number;
  estimatedArrival: string;
}

// ─── Support Ticket ───────────────────────────────────────────────────────────
export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'ADMIN' | 'USER' | 'SYSTEM';
  content: string;
  attachments?: string[];
  timestamp: string;
}

export interface TicketHistoryItem {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultAssigneeRole?: 'SUPPORT' | 'TECH' | 'PROVIDER';
  slaFirstResponseHours: number;
  slaResolutionHours: number;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userRole: 'FARMER' | 'PROVIDER' | 'BUYER' | 'SYSTEM';
  userAvatar?: string;
  category: string;
  type: 'PAYMENT' | 'TECHNICAL' | 'LOGISTICS' | 'DISEASE_REPORT' | 'OTHER' | string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attachments?: string[];
  assignedTo?: {
    id: string;
    name: string;
    role: 'SUPPORT' | 'TECH' | 'PROVIDER';
  };
  sla: {
    firstResponseDue: string;
    resolutionDue: string;
    isBreached: boolean;
  };
  linkedData?: {
    type: 'ORDER' | 'HARVEST' | 'PAYMENT' | 'IOT';
    id: string;
  };
  messages: TicketMessage[];
  history: TicketHistoryItem[];
  resolutionNotes?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  applicablePlan?: string;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductCategory = 'Feed' | 'Medicine' | 'Aerator' | 'IoT Device' | 'Equipment' | 'Chemical';
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

export interface ProductUsageSchedule {
  docFrom: number;    // Day Of Culture — start
  docTo: number;      // Day Of Culture — end
  dose: string;       // e.g. "2 kg/acre"
  frequency: string;  // e.g. "Daily", "Weekly", "Once"
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory?: string;
  description: string;
  usageInstructions?: string;
  dosageInfo?: string;
  warnings?: string;
  mrp: number;
  sellingPrice: number;
  discount: number; // %
  supplierId?: string;
  supplierName?: string;
  sku: string;
  stockQty: number;
  lowStockThreshold: number;
  unit: string; // kg, litre, piece, set
  tags: string[];
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  soldCount: number;
  imageUrl?: string;
  imageUrls?: string[];           // multiple product images
  speciesTarget?: string;         // e.g. "L. Vannamei"
  createdAt: string;
  updatedAt: string;
  // Compliance & Traceability
  expiryDate?: string;            // for medicines & biologicals
  batchNumber?: string;           // lot/batch number for traceability
  certifications?: string[];      // e.g. ["ISO", "FSSAI", "Drugs License"]
  certificationUrls?: string[];   // uploaded certificate doc URLs
  isRegulatoryApproved?: boolean; // admin must approve before product goes live
  regulatoryApprovedBy?: string;
  regulatoryApprovedAt?: string;
  maxDosePerAcre?: string;        // overdose warning threshold
  // Usage schedule by DOC (day of culture)
  usageSchedule?: ProductUsageSchedule[];
  // Farmer-tier pricing flag
  premiumFarmerDiscount?: number; // extra % off for subscribed farmers
}

// ─── Supplier / Vendor ────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  location: string;
  categories: ProductCategory[];
  performanceScore: number; // 0-100
  totalProducts: number;
  status: 'active' | 'inactive' | 'suspended';
  paymentTerms: string; // e.g. "Net 30"
  createdAt: string;
  // KYC & Compliance
  gstNumber?: string;
  panNumber?: string;
  licenseNumber?: string;       // drugs/FSSAI/trade license
  licenseType?: string;         // e.g. "Drug License", "FSSAI"
  kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  kycApprovedBy?: string;
  kycApprovedAt?: string;
  kycRejectionReason?: string;
  // Bank details for payouts
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  // Supplier management
  onboardingDate?: string;
  approvedProductIds?: string[];
  marginPercent?: number;       // AquaGrow margin on this supplier's products
  notes?: string;
}

// ─── Product Order (Shop Order) ───────────────────────────────────────────────
export interface ShopOrder {
  id: string;
  farmerId: string;
  farmerName: string;
  items: ShopOrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'UPI' | 'CARD' | 'COD' | 'WALLET';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  deliveryAddress: string;
  deliveryZone?: string;
  deliveryCharge: number;
  trackingId?: string;
  deliveryPartnerId?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelReason?: string;
  returnReason?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrderItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

// ─── Product Review ───────────────────────────────────────────────────────────
export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  rating: number; // 1-5
  comment: string;
  isFake?: boolean;
  isApproved: boolean;
  createdAt: string;
}

// ─── Delivery Zone ────────────────────────────────────────────────────────────
export interface DeliveryZone {
  id: string;
  name: string;
  charge: number;
  estimatedDays: number;
  regions: string[];
  isActive: boolean;
}

// ─── Employee Management ──────────────────────────────────────────────────────
export interface EmployeeTarget {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  salesTarget: number;
  subscriptionTarget: number;
  onboardingTarget: number;
  installationTarget: number;
  achievedSales: number;
  achievedSubscriptions: number;
  achievedOnboarding: number;
  achievedInstallations: number;
  incentiveEarned: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
}

export interface EmployeeVisit {
  id: string;
  employeeId: string;
  farmerId: string;
  farmerName: string;
  date: string;
  time: string;
  purpose: 'SUPPORT' | 'SALES' | 'INSPECTION' | 'MAINTENANCE';
  notes: string;
  images?: string[];
  gpsLocation?: { lat: number; lng: number };
}

export interface EmployeeTask {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  createdAt: string;
}

export interface EmployeeExpense {
  id: string;
  employeeId: string;
  amount: number;
  category: 'TRAVEL' | 'FUEL' | 'ALLOWANCE' | 'OTHER';
  description: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  activeHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

export interface EmployeeTraining {
  id: string;
  employeeId: string;
  moduleName: string;
  completionDate?: string;
  status: 'ASSIGNED' | 'COMPLETED';
  certificateUrl?: string;
}

// ─── Warehouse ────────────────────────────────────────────────────────────────
export interface Warehouse {
  id: string;
  name: string;
  location: string;
  address?: string;
  managerId?: string;
  managerName?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  unit: string;
  reason: string;
  referenceId?: string;   // order ID, procurement ID, etc.
  batchNumber?: string;
  performedBy: string;
  createdAt: string;
}

// ─── Delivery Partner ─────────────────────────────────────────────────────────
export interface DeliveryPartner {
  id: string;
  name: string;
  type: 'COURIER' | 'LOCAL_TRANSPORT' | 'OWN_FLEET';
  contactPerson: string;
  phone: string;
  email?: string;
  regions: string[];
  rating: number;
  deliveryChargePerKm?: number;
  minCharge?: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Product Pricing Rule ─────────────────────────────────────────────────────
export interface ProductPricingRule {
  id: string;
  productId: string;
  productName: string;
  ruleType: 'SUBSCRIPTION_TIER' | 'BULK_QTY' | 'REGION' | 'SEASONAL';
  condition: string;        // e.g. "GOLD_PLAN" | "qty>=50" | "Nellore"
  discountPercent: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── GST Invoice ──────────────────────────────────────────────────────────────
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  gstRate: number;          // e.g. 5, 12, 18
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;    // e.g. "INV-2026-0042"
  orderId: string;
  farmerId: string;
  farmerName: string;
  farmerAddress?: string;
  farmerGst?: string;
  supplierId?: string;
  supplierName?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalGst: number;
  totalAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  issuedAt: string;
  dueDate?: string;
  notes?: string;
}
