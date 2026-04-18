import {
  Farmer, Provider, Order, Transaction, Alert, PriceSetting, BuyerCompany,
  Ticket, TicketCategory, TicketMessage, TicketHistoryItem, FAQItem,
  Campaign, Pond, DailyLog, Harvest, Certification, IoTDevice,
  SubscriptionPlan, FarmerSubscription, ContentItem, Coupon,
  Product, Supplier, ShopOrder, ProductReview, DeliveryZone,
  EmployeeTarget, EmployeeVisit, EmployeeTask, EmployeeExpense,
  EmployeeAttendance, EmployeeTraining
} from '../types';

const KEYS = {
  FARMERS: 'ag_farmers',
  PROVIDERS: 'ag_providers',
  ORDERS: 'ag_orders',
  TRANSACTIONS: 'ag_transactions',
  ALERTS: 'ag_alerts',
  PRICES: 'ag_prices',
  BUYERS: 'ag_buyers',
  TICKETS: 'ag_tickets',
  CAMPAIGNS: 'ag_campaigns',
  PONDS: 'ag_ponds',
  DAILY_LOGS: 'ag_daily_logs',
  HARVESTS: 'ag_harvests',
  CERTIFICATIONS: 'ag_certifications',
  IOT_DEVICES: 'ag_iot_devices',
  SUB_PLANS: 'ag_sub_plans',
  FARMER_SUBS: 'ag_farmer_subs',
  CONTENT: 'ag_content',
  COUPONS: 'ag_coupons',
  PRODUCTS: 'ag_products',
  SUPPLIERS: 'ag_suppliers',
  SHOP_ORDERS: 'ag_shop_orders',
  REVIEWS: 'ag_product_reviews',
  DELIVERY_ZONES: 'ag_delivery_zones',
  TICKET_CATEGORIES: 'ag_ticket_categories',
  FAQ: 'ag_faq',
  EMPLOYEE_TARGETS: 'ag_emp_targets',
  EMPLOYEE_VISITS: 'ag_emp_visits',
  EMPLOYEE_TASKS: 'ag_emp_tasks',
  EMPLOYEE_EXPENSES: 'ag_emp_expenses',
  EMPLOYEE_ATTENDANCE: 'ag_emp_attendance',
  EMPLOYEE_TRAININGS: 'ag_emp_trainings',
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_FARMERS: Farmer[] = [
  { id: 'F-101', name: 'John Doe', location: 'Zone A', phone: '+91 9876543210', assignedProviderId: 'P-201', status: 'active', registrationStatus: 'approved', totalOrders: 15, joinedAt: '2025-10-12', rating: 4.8, creditScore: 750, totalPonds: 4, trustedFarmer: true, subscriptionPlanId: 'PLAN-002' },
  { id: 'F-102', name: 'Jane Smith', location: 'Zone B', phone: '+91 9876543211', assignedProviderId: 'P-202', status: 'active', registrationStatus: 'approved', totalOrders: 8, joinedAt: '2025-11-05', rating: 4.5, creditScore: 680, totalPonds: 2, subscriptionPlanId: 'PLAN-001' },
  { id: 'F-103', name: 'Mike Ross', location: 'Zone A', phone: '+91 9876543212', assignedProviderId: 'P-201', status: 'active', registrationStatus: 'approved', totalOrders: 22, joinedAt: '2025-09-20', rating: 4.9, creditScore: 820, totalPonds: 6, trustedFarmer: true, subscriptionPlanId: 'PLAN-003' },
  { id: 'F-104', name: 'Sarah Connor', location: 'Zone C', status: 'inactive', registrationStatus: 'approved', totalOrders: 0, joinedAt: '2026-01-15', rating: 0, creditScore: 0, totalPonds: 1, subscriptionPlanId: 'PLAN-001' },
  { id: 'F-105', name: 'Ravi Kumar', location: 'Zone B', phone: '+91 9876543213', status: 'pending', registrationStatus: 'pending', totalOrders: 0, joinedAt: '2026-04-15', rating: 0, creditScore: 0, totalPonds: 0 },
  { id: 'F-106', name: 'Anjali Devi', location: 'Zone A', phone: '+91 9876543214', status: 'flagged', registrationStatus: 'approved', totalOrders: 3, joinedAt: '2025-12-01', rating: 2.1, creditScore: 320, totalPonds: 1, isFlagged: true, flagReason: 'Suspicious data – uniform logs submitted for 7 consecutive days' },
];

const SEED_PROVIDERS: Provider[] = [
  { id: 'P-201', name: 'Green Valley', category: 'Aqua Consultant', rating: 4.8, location: 'Central Plains, USA', status: 'verified', regions: ['Zone A', 'Zone B'], performanceScore: 95, assignedFarmersCount: 12, activeOrdersCount: 4, verificationBadge: true, commissionRate: 5, subscriptionModel: 'verified', availability: 'available' },
  { id: 'P-202', name: 'AquaTech', category: 'Feed Supplier', rating: 4.5, location: 'Coastal Valley, CA', status: 'pending', regions: ['Zone B'], performanceScore: 88, assignedFarmersCount: 5, activeOrdersCount: 2, commissionRate: 4, subscriptionModel: 'premium', availability: 'available' },
  { id: 'P-203', name: 'EcoHarvest', category: 'Medicine Supplier', rating: 4.2, location: 'Kansas City, MO', status: 'verified', regions: ['Zone C'], performanceScore: 92, assignedFarmersCount: 8, activeOrdersCount: 3, verificationBadge: true, commissionRate: 6, subscriptionModel: 'premium', availability: 'busy' },
  { id: 'P-204', name: 'Midwest Harvest', category: 'Shrimp Logistics', rating: 4.9, location: 'Portland, OR', status: 'verified', regions: ['Zone A'], performanceScore: 98, assignedFarmersCount: 15, activeOrdersCount: 6, verificationBadge: true, commissionRate: 5, subscriptionModel: 'verified', availability: 'available' },
  { 
    id: 'P-205', name: 'Ravi Teja', category: 'Technician', rating: 4.2, location: 'Nellore, AP', status: 'verified', regions: ['Zone B'], 
    performanceScore: 85, assignedFarmersCount: 3, activeOrdersCount: 1, commissionRate: 0, subscriptionModel: 'free', availability: 'available',
    joiningDate: '2025-05-10', assignedArea: 'Nellore - North', internalRole: 'FIELD_TECH', appAccessLevel: 'TECHNICAL',
    totalSalesGenerated: 450000, totalOnboardingCount: 12, totalInstallationCount: 8
  },
  { 
    id: 'P-206', name: 'Sita Kumari', category: 'Sales', rating: 4.7, location: 'Nellore, AP', status: 'verified', regions: ['Zone A'], 
    performanceScore: 92, assignedFarmersCount: 8, activeOrdersCount: 3, commissionRate: 0, subscriptionModel: 'free', availability: 'available',
    joiningDate: '2025-02-15', assignedArea: 'Nellore - South', internalRole: 'SALES_EXEC', appAccessLevel: 'SALES',
    totalSalesGenerated: 1250000, totalOnboardingCount: 28, totalInstallationCount: 2
  },
];

const SEED_PONDS: Pond[] = [
  { id: 'PND-001', farmerId: 'F-101', farmerName: 'John Doe', name: 'Pond Alpha', sizeInAcres: 2.5, species: 'L. Vannamei', stockingDensity: 80, stockingDate: '2026-01-15', expectedHarvestDate: '2026-04-15', feedUsage: 1250, mortalityRate: 3.2, survivalRate: 96.8, status: 'ACTIVE', currentDoc: 90, estimatedWeight: 15, region: 'Zone A', waterQuality: { ph: 7.8, dissolvedOxygen: 6.2, temperature: 28.5, salinity: 15, ammonia: 0.02, recordedAt: '2026-04-17 08:00' } },
  { id: 'PND-002', farmerId: 'F-101', farmerName: 'John Doe', name: 'Pond Beta', sizeInAcres: 3.0, species: 'L. Vannamei', stockingDensity: 60, stockingDate: '2026-02-01', expectedHarvestDate: '2026-05-01', feedUsage: 980, mortalityRate: 4.1, survivalRate: 95.9, status: 'ALERT', currentDoc: 75, estimatedWeight: 12, region: 'Zone A' },
  { id: 'PND-003', farmerId: 'F-103', farmerName: 'Mike Ross', name: 'Ross Farm #1', sizeInAcres: 5.0, species: 'Tiger Shrimp', stockingDensity: 50, stockingDate: '2025-12-01', expectedHarvestDate: '2026-03-01', feedUsage: 2800, mortalityRate: 2.5, survivalRate: 97.5, status: 'HARVESTED', currentDoc: 120, estimatedWeight: 22, region: 'Zone A' },
  { id: 'PND-004', farmerId: 'F-102', farmerName: 'Jane Smith', name: 'Smith Pond 1', sizeInAcres: 1.5, species: 'L. Vannamei', stockingDensity: 70, stockingDate: '2026-03-01', expectedHarvestDate: '2026-06-01', feedUsage: 420, mortalityRate: 5.8, survivalRate: 94.2, status: 'DISEASE_DETECTED', currentDoc: 47, estimatedWeight: 8, region: 'Zone B' },
];

const SEED_LOGS: DailyLog[] = [
  { id: 'LOG-001', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-001', pondName: 'Pond Alpha', date: '2026-04-17', feedGiven: 45, mortalityCount: 12, waterPh: 7.8, dissolvedOxygen: 6.1, temperature: 28.5, notes: 'Normal conditions', status: 'submitted', submittedAt: '2026-04-17 07:30' },
  { id: 'LOG-002', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-001', pondName: 'Pond Alpha', date: '2026-04-16', feedGiven: 44, mortalityCount: 8, waterPh: 7.9, dissolvedOxygen: 6.3, temperature: 28.2, status: 'submitted', submittedAt: '2026-04-16 07:45' },
  { id: 'LOG-003', farmerId: 'F-102', farmerName: 'Jane Smith', pondId: 'PND-004', pondName: 'Smith Pond 1', date: '2026-04-17', feedGiven: 20, mortalityCount: 85, waterPh: 6.9, dissolvedOxygen: 3.8, temperature: 30.1, notes: 'High mortality. Shrimp behaving abnormally.', status: 'flagged', submittedAt: '2026-04-17 08:15', isAbnormal: true, abnormalReason: 'Dissolved oxygen critically low + high mortality' },
  { id: 'LOG-004', farmerId: 'F-106', farmerName: 'Anjali Devi', pondId: 'PND-000', pondName: 'Anjali Pond', date: '2026-04-17', feedGiven: 30, mortalityCount: 0, waterPh: 7.5, dissolvedOxygen: 6.0, temperature: 28.0, status: 'flagged', submittedAt: '2026-04-17 06:00', isAbnormal: true, abnormalReason: 'Identical data submitted for 7 consecutive days — possible fraud' },
  { id: 'LOG-M01', farmerId: 'F-104', farmerName: 'Sarah Connor', pondId: 'PND-005', pondName: 'Connor Pond', date: '2026-04-17', feedGiven: 0, mortalityCount: 0, waterPh: 0, dissolvedOxygen: 0, temperature: 0, status: 'missing' },
];

const SEED_HARVESTS: Harvest[] = [
  {
    id: 'HRV-001', farmerId: 'F-103', farmerName: 'Mike Ross', pondId: 'PND-003', pondName: 'Ross Farm #1', species: 'Tiger Shrimp', harvestType: 'TOTAL',
    requestDate: '2026-03-18', scheduledDate: '2026-03-20', harvestDate: '2026-03-20', estimatedQuantity: 4500, actualQuantity: 4320, quality: 'A', shrimpCount: 30,
    status: 'COMPLETED', isPartialHarvest: false, pricePerKg: 480, finalPricePerKg: 490, totalValue: 2116800, commission: 105840,
    verifiedBy: 'Admin', notes: 'Excellent batch. Grade A certified.',
    preHarvestChecks: { logsComplete: true, waterQualityStable: true, noMajorAlerts: true, certificationEligible: true, growthStageReady: true },
    providerAssignments: [{ providerId: 'P-204', providerName: 'Midwest Harvest', role: 'Harvest Technician', assignedAt: '2026-03-19', status: 'DONE' }, { providerId: 'P-204', providerName: 'Midwest Harvest', role: 'Transport', assignedAt: '2026-03-19', status: 'DONE' }],
    qualityCheck: { sizeCount: 30, avgWeight: 22, grade: 'A', healthCondition: 'EXCELLENT', inspectorName: 'Quality Inspector AP-01', certificateGenerated: true, reportedAt: '2026-03-20' },
    buyerOffers: [{ id: 'OFF-001', buyerId: 'B-001', buyerName: 'AquaPrime Exports', pricePerKg: 485, quantityKg: 4320, terms: 'FOB Nellore', status: 'ACCEPTED', offeredAt: '2026-03-21' }],
    confirmedBuyerId: 'B-001', confirmedBuyerName: 'AquaPrime Exports', dealLockedAt: '2026-03-21',
    advancePaid: true, advanceAmount: 423360,
    transportProviderName: 'Midwest Harvest', trackingNumber: 'TRK-MH-001', deliveryStatus: 'DELIVERED',
    paymentStatus: 'PAID', farmerPaidAt: '2026-03-25', certificationId: 'CERT-001',
    createdAt: '2026-03-18', updatedAt: '2026-03-25',
  },
  {
    id: 'HRV-002', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-001', pondName: 'Pond Alpha', species: 'L. Vannamei', harvestType: 'TOTAL',
    requestDate: '2026-04-16', estimatedQuantity: 2200, quality: 'A', shrimpCount: 32, status: 'REQUESTED', isPartialHarvest: false,
    notes: 'Ready for harvest. DOC 90 days, weight ~15g',
    preHarvestChecks: { logsComplete: true, waterQualityStable: true, noMajorAlerts: true, certificationEligible: true, growthStageReady: true },
    buyerOffers: [
      { id: 'OFF-002', buyerId: 'B-001', buyerName: 'AquaPrime Exports', pricePerKg: 495, quantityKg: 2200, terms: 'CIF Nellore', status: 'PENDING', offeredAt: '2026-04-17' },
      { id: 'OFF-003', buyerId: 'B-002', buyerName: 'Blue Ocean Traders', pricePerKg: 475, quantityKg: 2000, terms: 'Ex-Farm', status: 'PENDING', offeredAt: '2026-04-17' },
    ],
    deliveryStatus: 'NOT_DISPATCHED', paymentStatus: 'PENDING',
    createdAt: '2026-04-16', updatedAt: '2026-04-16',
  },
  {
    id: 'HRV-003', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-002', pondName: 'Pond Beta', species: 'L. Vannamei', harvestType: 'PARTIAL',
    requestDate: '2026-04-10', estimatedQuantity: 800, quality: 'B', shrimpCount: 40, status: 'APPROVED', isPartialHarvest: true, remainingStockKg: 1400,
    preHarvestChecks: { logsComplete: true, waterQualityStable: false, noMajorAlerts: false, certificationEligible: false, growthStageReady: false },
    riskFlag: 'ALERT: Water quality unstable. Partial harvest recommended.',
    deliveryStatus: 'NOT_DISPATCHED', paymentStatus: 'PENDING',
    createdAt: '2026-04-10', updatedAt: '2026-04-12',
  },
];

const SEED_CERTIFICATIONS: Certification[] = [
  { id: 'CERT-001', farmerId: 'F-103', farmerName: 'Mike Ross', type: 'TRUSTED_FARMER', status: 'APPROVED', appliedAt: '2026-03-01', reviewedAt: '2026-03-10', validUntil: '2027-03-10', reviewedBy: 'Admin', criteria: [{ label: 'Minimum 10 completed orders', met: true }, { label: 'Rating > 4.5', met: true }, { label: 'Zero fraud flags', met: true }, { label: 'Active > 6 months', met: true }] },
  { id: 'CERT-002', farmerId: 'F-101', farmerName: 'John Doe', type: 'QUALITY_ASSURED', status: 'PENDING_REVIEW', appliedAt: '2026-04-12', criteria: [{ label: 'Minimum 5 harvests', met: true }, { label: 'Avg quality grade A/B', met: true }, { label: 'Provider verified', met: true }, { label: 'No complaints in 90 days', met: false }] },
  { id: 'CERT-003', farmerId: 'F-102', farmerName: 'Jane Smith', type: 'TRUSTED_FARMER', status: 'ELIGIBLE', appliedAt: '2026-04-01', criteria: [{ label: 'Minimum 10 completed orders', met: false }, { label: 'Rating > 4.5', met: false }, { label: 'Zero fraud flags', met: true }, { label: 'Active > 6 months', met: true }] },
];

const SEED_IOT: IoTDevice[] = [
  { id: 'IOT-001', name: 'Aerator Alpha-1', type: 'AERATOR', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-001', pondName: 'Pond Alpha', status: 'ONLINE', lastSeen: '2026-04-17 08:55', autoMode: true, installDate: '2026-01-20', currentValue: 'Running 2.2kW' },
  { id: 'IOT-002', name: 'DO Sensor Alpha', type: 'OXYGEN_SENSOR', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-001', pondName: 'Pond Alpha', status: 'ONLINE', batteryLevel: 82, lastSeen: '2026-04-17 08:58', autoMode: false, installDate: '2026-01-20', currentValue: '6.2 mg/L' },
  { id: 'IOT-003', name: 'Aerator Beta-1', type: 'AERATOR', farmerId: 'F-101', farmerName: 'John Doe', pondId: 'PND-002', pondName: 'Pond Beta', status: 'FAULT', lastSeen: '2026-04-16 22:10', autoMode: true, installDate: '2026-02-05', currentValue: 'Error: Overload' },
  { id: 'IOT-004', name: 'Water Sensor Ross#1', type: 'WATER_SENSOR', farmerId: 'F-103', farmerName: 'Mike Ross', pondId: 'PND-003', pondName: 'Ross Farm #1', status: 'OFFLINE', batteryLevel: 12, lastSeen: '2026-04-14 18:00', autoMode: false, installDate: '2025-12-05', currentValue: 'No data' },
  { id: 'IOT-005', name: 'Power Meter Alpha', type: 'POWER_METER', farmerId: 'F-103', farmerName: 'Mike Ross', pondId: 'PND-003', pondName: 'Ross Farm #1', status: 'ONLINE', lastSeen: '2026-04-17 09:00', autoMode: false, installDate: '2025-12-05', currentValue: '8.4 kWh today' },
];

const SEED_PLANS: SubscriptionPlan[] = [
  { id: 'PLAN-001', name: 'Free', price: 0, yearlyPrice: 0, targetRole: 'farmer', isActive: true, color: '#6b7280', createdAt: '2026-01-01', features: [{ name: 'Daily Logs', included: true, limit: 'Limited (30/month)' }, { name: 'Pond Management', included: true, limit: '1 pond' }, { name: 'Provider Access', included: true, limit: 'Basic listing' }, { name: 'Certifications', included: false }, { name: 'IoT Integration', included: false }, { name: 'Analytics', included: false }], limits: { ponds: 1, dailyLogs: 30, iotDevices: 0, harvestEntries: 2, providerAccess: true, certifications: false, analytics: false, prioritySupport: false } },
  { id: 'PLAN-002', name: 'Basic', price: 499, yearlyPrice: 4990, targetRole: 'farmer', isActive: true, color: '#3b82f6', isPopular: false, createdAt: '2026-01-01', features: [{ name: 'Daily Logs', included: true, limit: 'Unlimited' }, { name: 'Pond Management', included: true, limit: '5 ponds' }, { name: 'Provider Access', included: true }, { name: 'Certifications', included: true, limit: 'Limited' }, { name: 'Smart Alerts', included: true }, { name: 'IoT Integration', included: false }], limits: { ponds: 5, dailyLogs: -1, iotDevices: 2, harvestEntries: -1, providerAccess: true, certifications: true, analytics: false, prioritySupport: false } },
  { id: 'PLAN-003', name: 'Pro', price: 1499, yearlyPrice: 14990, targetRole: 'farmer', isActive: true, isPopular: true, color: '#10b981', createdAt: '2026-01-01', features: [{ name: 'Daily Logs', included: true, limit: 'Unlimited' }, { name: 'Pond Management', included: true, limit: 'Unlimited' }, { name: 'IoT Integration', included: true, limit: 'Up to 20 devices' }, { name: 'Full Analytics', included: true }, { name: 'Priority Support', included: true }, { name: 'Certifications', included: true }], limits: { ponds: -1, dailyLogs: -1, iotDevices: 20, harvestEntries: -1, providerAccess: true, certifications: true, analytics: true, prioritySupport: true } },
  { id: 'PLAN-004', name: 'Provider Premium', price: 1999, yearlyPrice: 19990, targetRole: 'provider', isActive: true, color: '#f59e0b', createdAt: '2026-01-01', features: [{ name: 'Top Listing Priority', included: true }, { name: 'Lead Access', included: true, limit: 'First priority' }, { name: 'Verification Badge', included: true }, { name: 'Commission Control', included: true }, { name: 'Analytics', included: true }, { name: 'WhatsApp Notifications', included: true }], limits: { ponds: -1, dailyLogs: -1, iotDevices: -1, harvestEntries: -1, providerAccess: true, certifications: true, analytics: true, prioritySupport: true } },
];

const SEED_FARMER_SUBS: FarmerSubscription[] = [
  { id: 'SUB-001', farmerId: 'F-101', farmerName: 'John Doe', planId: 'PLAN-002', planName: 'Basic', status: 'ACTIVE', startDate: '2026-01-01', endDate: '2026-12-31', autoRenew: true, paymentMethod: 'UPI', amountPaid: 4990, usagePonds: 4, usageLogs: 245, usageDevices: 2, lastPaymentDate: '2026-01-01' },
  { id: 'SUB-002', farmerId: 'F-102', farmerName: 'Jane Smith', planId: 'PLAN-001', planName: 'Free', status: 'ACTIVE', startDate: '2025-11-05', endDate: '2099-01-01', autoRenew: false, paymentMethod: 'OFFLINE', amountPaid: 0, usagePonds: 2, usageLogs: 89, usageDevices: 0 },
  { id: 'SUB-003', farmerId: 'F-103', farmerName: 'Mike Ross', planId: 'PLAN-003', planName: 'Pro', status: 'ACTIVE', startDate: '2026-01-01', endDate: '2026-12-31', autoRenew: true, paymentMethod: 'CARD', amountPaid: 14990, usagePonds: 6, usageLogs: 540, usageDevices: 5, lastPaymentDate: '2026-01-01' },
  { id: 'SUB-004', farmerId: 'F-104', farmerName: 'Sarah Connor', planId: 'PLAN-001', planName: 'Free', status: 'SUSPENDED', startDate: '2026-01-15', endDate: '2026-04-01', autoRenew: false, paymentMethod: 'OFFLINE', amountPaid: 0, usagePonds: 1, usageLogs: 0, usageDevices: 0 },
];

const SEED_CONTENT: ContentItem[] = [
  { id: 'CNT-001', title: 'Monsoon Preparation Guide for Shrimp Farmers', type: 'GUIDE', category: 'Seasonal', summary: 'Prepare your ponds for the upcoming monsoon with these essential steps.', content: 'Full guide content here...', targetAudience: 'farmers', publishedAt: '2026-04-10', status: 'PUBLISHED', views: 284, tags: ['monsoon', 'shrimp', 'preparation'] },
  { id: 'CNT-002', title: 'White Spot Syndrome Disease Alert - Zone B', type: 'ALERT', category: 'Disease', summary: 'Critical alert: White Spot Syndrome detected in Zone B. Take immediate action.', content: 'Alert details...', targetAudience: 'farmers', publishedAt: '2026-04-12', status: 'PUBLISHED', views: 912, tags: ['disease', 'wssv', 'zone-b'] },
  { id: 'CNT-003', title: 'How to Optimize Feed Conversion Ratio', type: 'TRAINING', category: 'Best Practices', summary: 'Learn how to maximize shrimp growth while minimizing feed waste.', content: 'Training content here...', targetAudience: 'all', publishedAt: '2026-04-05', status: 'PUBLISHED', views: 156, tags: ['feed', 'fcr', 'optimization'] },
];

const SEED_COUPONS: Coupon[] = [
  { id: 'CPN-001', code: 'AQUA2026', discountType: 'PERCENT', discountValue: 20, usageLimit: 100, usedCount: 34, expiresAt: '2026-06-30', isActive: true, createdAt: '2026-01-01' },
  { id: 'CPN-002', code: 'REFER500', discountType: 'FIXED', discountValue: 500, usageLimit: 500, usedCount: 128, expiresAt: '2026-12-31', isActive: true, createdAt: '2026-01-01' },
  { id: 'CPN-003', code: 'MONSOON30', discountType: 'PERCENT', discountValue: 30, applicablePlan: 'PLAN-002', usageLimit: 50, usedCount: 50, expiresAt: '2026-04-01', isActive: false, createdAt: '2026-03-01' },
];

const SEED_ORDERS: Order[] = [
  { id: 'ORD-001', farmerId: 'F-101', farmerName: 'John Doe', providerId: 'P-201', providerName: 'Green Valley', status: 'SENT_TO_COMPANY', items: [{ type: 'Shrimp', quantity: 500, unit: 'kg' }], farmerPrice: 450, companyPrice: 470, location: 'Zone A', createdAt: '2026-04-10 08:00' },
  { id: 'ORD-002', farmerId: 'F-102', farmerName: 'Jane Smith', providerId: 'P-202', providerName: 'AquaTech', status: 'PENDING_PROVIDER', items: [{ type: 'Shrimp', quantity: 300, unit: 'kg' }], farmerPrice: 420, companyPrice: 440, location: 'Zone B', createdAt: '2026-04-10 09:30' },
  { id: 'ORD-003', farmerId: 'F-103', farmerName: 'Mike Ross', providerId: 'P-201', providerName: 'Green Valley', status: 'COMPLETED', items: [{ type: 'Shrimp', quantity: 1000, unit: 'kg' }], farmerPrice: 470, companyPrice: 490, location: 'Zone A', createdAt: '2026-04-09 14:00', buyerName: 'Global Exports Co.', buyerId: 'B-001', adminApproval: { approved: true, approvedBy: 'admin', approvedAt: '2026-04-09 16:00', finalPrice: 490 } },
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-001', type: 'PAYMENT', amount: 240000, date: '2026-04-10', status: 'completed', fromId: 'B-001', toId: 'ADMIN', orderId: 'ORD-003' },
  { id: 'TXN-002', type: 'COMMISSION', amount: 10000, date: '2026-04-10', status: 'completed', fromId: 'P-201', toId: 'ADMIN', orderId: 'ORD-003' },
  { id: 'TXN-003', type: 'SUBSCRIPTION', amount: 4990, date: '2026-01-01', status: 'completed', fromId: 'F-101', toId: 'ADMIN', description: 'Basic Plan - Annual' },
  { id: 'TXN-004', type: 'SUBSCRIPTION', amount: 14990, date: '2026-01-01', status: 'completed', fromId: 'F-103', toId: 'ADMIN', description: 'Pro Plan - Annual' },
  { id: 'TXN-005', type: 'WALLET_TOPUP', amount: 5000, date: '2026-04-09', status: 'pending', fromId: 'F-102', toId: 'WALLET' },
];

const SEED_PRICES: PriceSetting[] = [
  { id: 'PRC-001', cropType: 'Shrimp', count: 30, quality: 'PREMIUM', location: 'Zone A', pricePerKg: 490, lastUpdated: '2026-04-10', trend: 'up' },
  { id: 'PRC-002', cropType: 'Shrimp', count: 40, quality: 'STANDARD', location: 'Zone A', pricePerKg: 450, lastUpdated: '2026-04-10', trend: 'stable' },
  { id: 'PRC-003', cropType: 'Shrimp', count: 60, quality: 'ECONOMY', location: 'Zone B', pricePerKg: 380, lastUpdated: '2026-04-09', trend: 'down' },
];

const SEED_BUYERS: BuyerCompany[] = [
  { id: 'B-001', name: 'AquaPrime Exports', contactPerson: 'Ramesh Iyer', phone: '+91 98001 10001', email: 'ramesh@aquaprime.in', location: 'Nellore, AP', state: 'Andhra Pradesh', buyerType: 'Exporter', preferredSpecies: 'L. Vannamei', licenseNumber: 'EXP-AP-2024-001', gstNumber: '37AAAAA0000A1Z1', baseRate: 490, demand: 8000, rating: 4.9, paymentSpeed: 'FAST', status: 'active', verificationStatus: 'verified', segment: 'high-value', isVerifiedBadge: true, otpVerified: true, totalDealsCompleted: 28, totalSpent: 8500000, commissionRate: 5, activeOrders: 5, lastActiveAt: '2026-04-17', joinedAt: '2025-06-01' },
  { id: 'B-002', name: 'Blue Ocean Traders', contactPerson: 'Suresh Kumar', phone: '+91 98001 20002', email: 'suresh@blueocean.in', location: 'Visakhapatnam, AP', state: 'Andhra Pradesh', buyerType: 'Wholesaler', preferredSpecies: 'L. Vannamei', baseRate: 475, demand: 3000, rating: 4.5, paymentSpeed: 'AVERAGE', status: 'active', verificationStatus: 'verified', segment: 'frequent', isVerifiedBadge: true, otpVerified: true, totalDealsCompleted: 14, totalSpent: 2100000, commissionRate: 5, activeOrders: 2, lastActiveAt: '2026-04-15', joinedAt: '2025-08-01' },
  { id: 'B-003', name: 'Coastal Seafood Co.', contactPerson: 'Priya Menon', phone: '+91 98001 30003', email: 'priya@coastalseafood.in', location: 'Kochi, KL', state: 'Kerala', buyerType: 'Processor', preferredSpecies: 'P. Monodon', gstNumber: '32BBBBB0000B2Z2', baseRate: 620, demand: 2000, rating: 4.2, paymentSpeed: 'AVERAGE', status: 'active', verificationStatus: 'verified', segment: 'exporter', isVerifiedBadge: false, otpVerified: true, totalDealsCompleted: 9, totalSpent: 1800000, commissionRate: 4, activeOrders: 1, lastActiveAt: '2026-04-14', joinedAt: '2025-10-01' },
  { id: 'B-004', name: 'Fresh Catch Ltd.', contactPerson: 'Arjun Rao', phone: '+91 98001 40004', location: 'Chennai, TN', state: 'Tamil Nadu', buyerType: 'Local Trader', preferredSpecies: 'L. Vannamei', baseRate: 455, demand: 500, rating: 2.8, paymentSpeed: 'SLOW', status: 'active', verificationStatus: 'pending', segment: 'new', isVerifiedBadge: false, otpVerified: false, totalDealsCompleted: 1, totalSpent: 227500, commissionRate: 5, activeOrders: 1, lastActiveAt: '2026-04-08', joinedAt: '2026-04-01' },
];

const SEED_TICKET_CATEGORIES: TicketCategory[] = [
  { id: 'CAT-1', name: 'Orders & Delivery', priority: 'HIGH', defaultAssigneeRole: 'SUPPORT', slaFirstResponseHours: 1, slaResolutionHours: 24 },
  { id: 'CAT-2', name: 'Payments & Refunds', priority: 'HIGH', defaultAssigneeRole: 'SUPPORT', slaFirstResponseHours: 2, slaResolutionHours: 48 },
  { id: 'CAT-3', name: 'Harvest Issues', priority: 'MEDIUM', defaultAssigneeRole: 'TECH', slaFirstResponseHours: 4, slaResolutionHours: 72 },
  { id: 'CAT-4', name: 'IoT / Device Issues', priority: 'CRITICAL', defaultAssigneeRole: 'TECH', slaFirstResponseHours: 0.5, slaResolutionHours: 12 },
  { id: 'CAT-5', name: 'Product Quality', priority: 'MEDIUM', defaultAssigneeRole: 'SUPPORT', slaFirstResponseHours: 8, slaResolutionHours: 96 },
];

const SEED_FAQ: FAQItem[] = [
  { id: 'FAQ-1', question: 'Payment failed but amount deducted?', answer: 'Usually, the amount is refunded to your source account within 5-7 business days. If not, please raise a ticket with the Transaction ID.', category: 'Payments', lastUpdated: '2026-04-01' },
  { id: 'FAQ-2', question: 'How to recalibrate DO sensor?', answer: 'Remove the sensor from water, wipe it dry, and use the "Calibrate" button in the IoT dashboard.', category: 'IoT Devices', lastUpdated: '2026-04-05' },
  { id: 'FAQ-3', question: 'Harvest pickup is delayed?', answer: 'Pickup delays can happen due to logistics. Check your "Harvest Monitor" for real-time truck tracking.', category: 'Logistics', lastUpdated: '2026-04-10' },
];

const SEED_TICKETS: Ticket[] = [
  {
    id: 'TKT-001', userId: 'F-101', userName: 'John Doe', userRole: 'FARMER', category: 'Payments & Refunds', type: 'PAYMENT',
    subject: 'Payment not received for ORD-001', description: 'The payment for order ORD-001 was supposed to arrive 3 days ago but has not been credited.',
    status: 'IN_PROGRESS', priority: 'HIGH', createdAt: '2026-04-11', updatedAt: '2026-04-12',
    sla: { firstResponseDue: '2026-04-11T09:00:00Z', resolutionDue: '2026-04-13T07:00:00Z', isBreached: false },
    escalationLevel: 0,
    messages: [
      { id: 'MSG-1', senderId: 'F-101', senderName: 'John Doe', senderRole: 'USER', content: 'The payment for order ORD-001 was supposed to arrive 3 days ago but has not been credited.', timestamp: '2026-04-11T07:00:00Z' },
      { id: 'MSG-2', senderId: 'ADMIN', senderName: 'Support Agent', senderRole: 'ADMIN', content: 'We are checking with the bank. Please wait.', timestamp: '2026-04-12T10:00:00Z' }
    ],
    history: [
      { id: 'HST-1', action: 'CREATED', performedBy: 'John Doe', timestamp: '2026-04-11T07:00:00Z' },
      { id: 'HST-2', action: 'ASSIGNED', performedBy: 'System', timestamp: '2026-04-11T07:05:00Z', details: 'Assigned to Support Team' }
    ],
    linkedData: { type: 'ORDER', id: 'ORD-001' }
  },
  {
    id: 'TKT-002', userId: 'F-102', userName: 'Jane Smith', userRole: 'FARMER', category: 'Harvest Issues', type: 'DISEASE_REPORT',
    subject: 'Possible disease outbreak in Pond 2', description: 'Noticed unusual mortality. Requesting urgent AI analysis.',
    status: 'OPEN', priority: 'CRITICAL', createdAt: '2026-04-12', updatedAt: '2026-04-12',
    sla: { firstResponseDue: '2026-04-12T07:30:00Z', resolutionDue: '2026-04-12T19:00:00Z', isBreached: true },
    escalationLevel: 1,
    messages: [
      { id: 'MSG-3', senderId: 'F-102', senderName: 'Jane Smith', senderRole: 'USER', content: 'Noticed unusual mortality. Requesting urgent AI analysis.', timestamp: '2026-04-12T07:00:00Z' }
    ],
    history: [
      { id: 'HST-3', action: 'CREATED', performedBy: 'Jane Smith', timestamp: '2026-04-12T07:00:00Z' }
    ],
    linkedData: { type: 'IOT', id: 'IOT-002' }
  },
];

const SEED_CAMPAIGNS: Campaign[] = [
  { id: 'CMP-001', title: 'Monsoon Preparation Alert', type: 'SMS', status: 'ACTIVE', targetRegion: 'Zone A', targetAudience: 'farmers', message: 'Dear Farmer, prepare your ponds for the upcoming monsoon season.', sentCount: 48, createdAt: '2026-04-10' },
  { id: 'CMP-002', title: 'Premium Price Offer', type: 'WHATSAPP', status: 'SCHEDULED', targetRegion: 'All', targetAudience: 'farmers', message: 'Special harvest pricing this week! Count 30 shrimp at ₹510/kg.', sentCount: 0, createdAt: '2026-04-12' },
];

const SEED_EMP_TARGETS: EmployeeTarget[] = [
  { id: 'TGT-001', employeeId: 'P-205', month: '2026-04', salesTarget: 500000, subscriptionTarget: 10, onboardingTarget: 5, installationTarget: 3, achievedSales: 320000, achievedSubscriptions: 6, achievedOnboarding: 3, achievedInstallations: 2, incentiveEarned: 4500, status: 'IN_PROGRESS' },
];

const SEED_EMP_VISITS: EmployeeVisit[] = [
  { id: 'VST-001', employeeId: 'P-205', farmerId: 'F-101', farmerName: 'John Doe', date: '2026-04-15', time: '10:30', purpose: 'SUPPORT', notes: 'Helped with aerator installation and water testing.', gpsLocation: { lat: 15.42, lng: 80.01 } },
  { id: 'VST-002', employeeId: 'P-205', farmerId: 'F-102', farmerName: 'Jane Smith', date: '2026-04-16', time: '14:00', purpose: 'SALES', notes: 'Discussed premium subscription benefits.', gpsLocation: { lat: 15.45, lng: 80.05 } },
];

const SEED_EMP_TASKS: EmployeeTask[] = [
  { id: 'TSK-001', employeeId: 'P-205', title: 'Install DO Sensor', description: 'Install version 2 sensor at Pond Alpha for John Doe.', dueDate: '2026-04-20', priority: 'HIGH', status: 'ASSIGNED', createdAt: '2026-04-17' },
];

const SEED_EMP_EXPENSES: EmployeeExpense[] = [
  { id: 'EXP-001', employeeId: 'P-205', amount: 1200, category: 'FUEL', description: 'Fuel for field visit to Zone B', status: 'PENDING', date: '2026-04-16' },
];

const SEED_EMP_ATTENDANCE: EmployeeAttendance[] = [
  { id: 'ATT-001', employeeId: 'P-205', date: '2026-04-17', loginTime: '09:00', logoutTime: '18:00', activeHours: 8, status: 'PRESENT' },
];

const SEED_EMP_TRAININGS: EmployeeTraining[] = [
  { id: 'TRN-001', employeeId: 'P-205', moduleName: 'IoT Device Maintenance', status: 'COMPLETED', completionDate: '2026-03-15' },
];

// ─── Storage Service Class ────────────────────────────────────────────────────

class StorageService {
  private get<T>(key: string, seed: T[]): T[] {
    const data = localStorage.getItem(key);
    if (!data) { localStorage.setItem(key, JSON.stringify(seed)); return seed; }
    return JSON.parse(data);
  }
  private set<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
  private upsert<T extends { id: string }>(key: string, seed: T[], item: T): void {
    const list = this.get<T>(key, seed);
    const idx = list.findIndex((x) => x.id === item.id);
    idx > -1 ? (list[idx] = item) : list.push(item);
    this.set(key, list);
  }
  private remove<T extends { id: string }>(key: string, seed: T[], id: string): void {
    this.set(key, this.get<T>(key, seed).filter((x) => x.id !== id));
  }

  // ── Farmers ──────────────────────────────────────────────────────────────
  getFarmers() { return this.get<Farmer>(KEYS.FARMERS, SEED_FARMERS); }
  saveFarmer(f: Farmer) { this.upsert(KEYS.FARMERS, SEED_FARMERS, f); }
  deleteFarmer(id: string) { this.remove(KEYS.FARMERS, SEED_FARMERS, id); }

  approveFarmer(id: string) {
    const list = this.getFarmers();
    const f = list.find(x => x.id === id);
    if (f) { f.registrationStatus = 'approved'; f.status = 'active'; this.set(KEYS.FARMERS, list); }
  }
  rejectFarmer(id: string) {
    const list = this.getFarmers();
    const f = list.find(x => x.id === id);
    if (f) { f.registrationStatus = 'rejected'; f.status = 'inactive'; this.set(KEYS.FARMERS, list); }
  }
  flagFarmer(id: string, reason: string) {
    const list = this.getFarmers();
    const f = list.find(x => x.id === id);
    if (f) { f.isFlagged = true; f.flagReason = reason; f.status = 'flagged'; this.set(KEYS.FARMERS, list); }
  }
  setTrustedFarmer(id: string, trusted: boolean) {
    const list = this.getFarmers();
    const f = list.find(x => x.id === id);
    if (f) { f.trustedFarmer = trusted; this.set(KEYS.FARMERS, list); }
  }

  // ── Providers ────────────────────────────────────────────────────────────
  getProviders() { return this.get<Provider>(KEYS.PROVIDERS, SEED_PROVIDERS); }
  saveProvider(p: Provider) { this.upsert(KEYS.PROVIDERS, SEED_PROVIDERS, p); }
  deleteProvider(id: string) { this.remove(KEYS.PROVIDERS, SEED_PROVIDERS, id); }
  verifyProvider(id: string) {
    const list = this.getProviders();
    const p = list.find(x => x.id === id);
    if (p) { p.status = 'verified'; p.verificationBadge = true; this.set(KEYS.PROVIDERS, list); }
  }
  disableProvider(id: string) {
    const list = this.getProviders();
    const p = list.find(x => x.id === id);
    if (p) { p.status = 'disabled'; this.set(KEYS.PROVIDERS, list); }
  }
  assignProviderToFarmer(farmerId: string, providerId: string | undefined) {
    const farmers = this.getFarmers();
    const farmer = farmers.find(f => f.id === farmerId);
    if (!farmer) return;
    const oldId = farmer.assignedProviderId;
    farmer.assignedProviderId = providerId;
    this.set(KEYS.FARMERS, farmers);
    const providers = this.getProviders();
    if (oldId) { const p = providers.find(x => x.id === oldId); if (p) p.assignedFarmersCount = Math.max(0, p.assignedFarmersCount - 1); }
    if (providerId) { const p = providers.find(x => x.id === providerId); if (p) p.assignedFarmersCount += 1; }
    this.set(KEYS.PROVIDERS, providers);
  }

  // ── Ponds ─────────────────────────────────────────────────────────────────
  getPonds() { return this.get<Pond>(KEYS.PONDS, SEED_PONDS); }
  savePond(p: Pond) { this.upsert(KEYS.PONDS, SEED_PONDS, p); }
  deletePond(id: string) { this.remove(KEYS.PONDS, SEED_PONDS, id); }

  // ── Daily Logs ────────────────────────────────────────────────────────────
  getLogs() { return this.get<DailyLog>(KEYS.DAILY_LOGS, SEED_LOGS); }
  saveLog(l: DailyLog) { this.upsert(KEYS.DAILY_LOGS, SEED_LOGS, l); }
  flagLog(id: string, reason: string) {
    const list = this.getLogs();
    const l = list.find(x => x.id === id);
    if (l) { l.status = 'flagged'; l.isAbnormal = true; l.abnormalReason = reason; this.set(KEYS.DAILY_LOGS, list); }
  }

  // ── Harvests ──────────────────────────────────────────────────────────────
  getHarvests() { return this.get<Harvest>(KEYS.HARVESTS, SEED_HARVESTS); }
  saveHarvest(h: Harvest) { this.upsert(KEYS.HARVESTS, SEED_HARVESTS, h); }
  approveHarvest(id: string, pricePerKg: number) {
    const list = this.getHarvests();
    const h = list.find(x => x.id === id);
    if (h) { h.status = 'APPROVED'; h.pricePerKg = pricePerKg; h.totalValue = pricePerKg * (h.estimatedQuantity); this.set(KEYS.HARVESTS, list); }
  }
  rejectHarvest(id: string, notes: string) {
    const list = this.getHarvests();
    const h = list.find(x => x.id === id);
    if (h) { h.status = 'REJECTED'; h.notes = notes; this.set(KEYS.HARVESTS, list); }
  }
  completeHarvest(id: string, actualQty: number) {
    const list = this.getHarvests();
    const h = list.find(x => x.id === id);
    if (h) { h.status = 'COMPLETED'; h.actualQuantity = actualQty; h.harvestDate = new Date().toISOString().split('T')[0]; h.verifiedBy = 'Admin'; h.totalValue = (h.pricePerKg || 0) * actualQty; this.set(KEYS.HARVESTS, list); }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  getCertifications() { return this.get<Certification>(KEYS.CERTIFICATIONS, SEED_CERTIFICATIONS); }
  saveCertification(c: Certification) { this.upsert(KEYS.CERTIFICATIONS, SEED_CERTIFICATIONS, c); }
  approveCertification(id: string) {
    const list = this.getCertifications();
    const c = list.find(x => x.id === id);
    if (c) { c.status = 'APPROVED'; c.reviewedAt = new Date().toISOString().split('T')[0]; c.reviewedBy = 'Admin'; c.validUntil = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]; this.set(KEYS.CERTIFICATIONS, list); this.setTrustedFarmer(c.farmerId, true); }
  }
  rejectCertification(id: string) {
    const list = this.getCertifications();
    const c = list.find(x => x.id === id);
    if (c) { c.status = 'REJECTED'; c.reviewedAt = new Date().toISOString().split('T')[0]; c.reviewedBy = 'Admin'; this.set(KEYS.CERTIFICATIONS, list); }
  }
  revokeCertification(id: string) {
    const list = this.getCertifications();
    const c = list.find(x => x.id === id);
    if (c) { c.status = 'REVOKED'; this.set(KEYS.CERTIFICATIONS, list); this.setTrustedFarmer(c.farmerId, false); }
  }

  // ── IoT Devices ───────────────────────────────────────────────────────────
  getIoTDevices() { return this.get<IoTDevice>(KEYS.IOT_DEVICES, SEED_IOT); }
  saveIoTDevice(d: IoTDevice) { this.upsert(KEYS.IOT_DEVICES, SEED_IOT, d); }
  deleteIoTDevice(id: string) { this.remove(KEYS.IOT_DEVICES, SEED_IOT, id); }
  toggleAutoMode(id: string) {
    const list = this.getIoTDevices();
    const d = list.find(x => x.id === id);
    if (d) { d.autoMode = !d.autoMode; this.set(KEYS.IOT_DEVICES, list); }
  }

  // ── Subscription Plans ────────────────────────────────────────────────────
  getPlans() { return this.get<SubscriptionPlan>(KEYS.SUB_PLANS, SEED_PLANS); }
  savePlan(p: SubscriptionPlan) { this.upsert(KEYS.SUB_PLANS, SEED_PLANS, p); }

  // ── Farmer Subscriptions ──────────────────────────────────────────────────
  getFarmerSubs() { return this.get<FarmerSubscription>(KEYS.FARMER_SUBS, SEED_FARMER_SUBS); }
  saveFarmerSub(s: FarmerSubscription) { this.upsert(KEYS.FARMER_SUBS, SEED_FARMER_SUBS, s); }
  upgradeFarmerPlan(subId: string, planId: string) {
    const list = this.getFarmerSubs();
    const s = list.find(x => x.id === subId);
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (s && plan) { s.planId = planId; s.planName = plan.name; this.set(KEYS.FARMER_SUBS, list); }
  }

  // ── Content ───────────────────────────────────────────────────────────────
  getContent() { return this.get<ContentItem>(KEYS.CONTENT, SEED_CONTENT); }
  saveContent(c: ContentItem) { this.upsert(KEYS.CONTENT, SEED_CONTENT, c); }
  deleteContent(id: string) { this.remove(KEYS.CONTENT, SEED_CONTENT, id); }

  // ── Coupons ───────────────────────────────────────────────────────────────
  getCoupons() { return this.get<Coupon>(KEYS.COUPONS, SEED_COUPONS); }
  saveCoupon(c: Coupon) { this.upsert(KEYS.COUPONS, SEED_COUPONS, c); }
  deleteCoupon(id: string) { this.remove(KEYS.COUPONS, SEED_COUPONS, id); }

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders() { return this.get<Order>(KEYS.ORDERS, SEED_ORDERS); }
  saveOrder(o: Order) { this.upsert(KEYS.ORDERS, SEED_ORDERS, o); }
  approveOrder(id: string, finalPrice: number, buyerId: string, buyerName: string, notes?: string) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (!o) return;
    o.status = 'ADMIN_APPROVED'; o.buyerId = buyerId; o.buyerName = buyerName; o.companyPrice = finalPrice;
    o.adminApproval = { approved: true, approvedBy: 'Super Admin', approvedAt: new Date().toISOString(), finalPrice, notes };
    this.set(KEYS.ORDERS, orders);
    this.saveTransaction({ id: `TXN-${Date.now()}`, type: 'PAYMENT', amount: finalPrice * o.items[0].quantity, date: new Date().toISOString().split('T')[0], status: 'pending', fromId: buyerId, toId: 'ADMIN', orderId: id });
  }
  rejectOrder(id: string, notes?: string) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (o) { o.status = 'REJECTED'; o.adminApproval = { approved: false, approvedBy: 'Super Admin', approvedAt: new Date().toISOString(), finalPrice: 0, notes }; this.set(KEYS.ORDERS, orders); }
  }
  completeOrder(id: string) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (o) { o.status = 'COMPLETED'; this.set(KEYS.ORDERS, orders); }
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  getTransactions() { return this.get<Transaction>(KEYS.TRANSACTIONS, SEED_TRANSACTIONS); }
  saveTransaction(t: Transaction) {
    const list = this.getTransactions();
    const idx = list.findIndex(x => x.id === t.id);
    idx > -1 ? (list[idx] = t) : list.unshift(t);
    this.set(KEYS.TRANSACTIONS, list);
  }

  // ── Price Settings ────────────────────────────────────────────────────────
  getPrices() { return this.get<PriceSetting>(KEYS.PRICES, SEED_PRICES); }
  savePrice(p: PriceSetting) { this.upsert(KEYS.PRICES, SEED_PRICES, { ...p, lastUpdated: new Date().toISOString().split('T')[0] }); }
  deletePrice(id: string) { this.remove(KEYS.PRICES, SEED_PRICES, id); }

  // ── Buyers ────────────────────────────────────────────────────────────────
  getBuyers() { return this.get<BuyerCompany>(KEYS.BUYERS, SEED_BUYERS); }
  saveBuyer(b: BuyerCompany) { this.upsert(KEYS.BUYERS, SEED_BUYERS, b); }
  deleteBuyer(id: string) { this.remove(KEYS.BUYERS, SEED_BUYERS, id); }

  // ── Tickets ───────────────────────────────────────────────────────────────
  getTickets() { return this.get<Ticket>(KEYS.TICKETS, SEED_TICKETS); }
  getTicketCategories() { return this.get<TicketCategory>(KEYS.TICKET_CATEGORIES, SEED_TICKET_CATEGORIES); }

  saveTicket(t: Ticket) { this.upsert(KEYS.TICKETS, SEED_TICKETS, { ...t, updatedAt: new Date().toISOString().split('T')[0] }); }
  saveTicketCategory(c: TicketCategory) { this.upsert(KEYS.TICKET_CATEGORIES, SEED_TICKET_CATEGORIES, c); }
  deleteTicketCategory(id: string) { this.remove(KEYS.TICKET_CATEGORIES, SEED_TICKET_CATEGORIES, id); }

  updateTicketStatus(id: string, status: Ticket['status']) {
    const list = this.getTickets();
    const t = list.find(x => x.id === id);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
      t.history.unshift({
        id: `HST-${Date.now()}`,
        action: 'STATUS_CHANGE',
        performedBy: 'Admin',
        timestamp: new Date().toISOString(),
        details: `Status changed to ${status}`
      });
      this.set(KEYS.TICKETS, list);
    }
  }

  addTicketMessage(ticketId: string, message: Omit<TicketMessage, 'id' | 'timestamp'>) {
    const list = this.getTickets();
    const t = list.find(x => x.id === ticketId);
    if (t) {
      const msg: TicketMessage = {
        ...message,
        id: `MSG-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      t.messages.push(msg);
      t.updatedAt = new Date().toISOString();
      this.set(KEYS.TICKETS, list);
    }
  }

  assignTicket(ticketId: string, assignee: Ticket['assignedTo']) {
    const list = this.getTickets();
    const t = list.find(x => x.id === ticketId);
    if (t) {
      t.assignedTo = assignee;
      t.updatedAt = new Date().toISOString();
      t.history.unshift({
        id: `HST-${Date.now()}`,
        action: 'ASSIGNED',
        performedBy: 'Admin',
        timestamp: new Date().toISOString(),
        details: `Assigned to ${assignee?.name} (${assignee?.role})`
      });
      this.set(KEYS.TICKETS, list);
    }
  }

  resolveTicket(ticketId: string, notes: string) {
    const list = this.getTickets();
    const t = list.find(x => x.id === ticketId);
    if (t) {
      t.status = 'RESOLVED';
      t.resolutionNotes = notes;
      t.updatedAt = new Date().toISOString();
      t.history.unshift({
        id: `HST-${Date.now()}`,
        action: 'RESOLVED',
        performedBy: 'Admin',
        timestamp: new Date().toISOString(),
        details: notes
      });
      this.set(KEYS.TICKETS, list);
    }
  }

  // ── Knowledge Base ────────────────────────────────────────────────────────
  getFAQ() { return this.get<FAQItem>(KEYS.FAQ, SEED_FAQ); }
  saveFAQ(item: FAQItem) { this.upsert(KEYS.FAQ, SEED_FAQ, item); }
  deleteFAQ(id: string) { this.remove(KEYS.FAQ, SEED_FAQ, id); }

  // ── Campaigns ─────────────────────────────────────────────────────────────
  getCampaigns() { return this.get<Campaign>(KEYS.CAMPAIGNS, SEED_CAMPAIGNS); }
  saveCampaign(c: Campaign) { this.upsert(KEYS.CAMPAIGNS, SEED_CAMPAIGNS, c); }
  deleteCampaign(id: string) { this.remove(KEYS.CAMPAIGNS, SEED_CAMPAIGNS, id); }

  // ── Computed Stats ────────────────────────────────────────────────────────
  getFinanceStats() {
    const orders = this.getOrders().filter(o => o.status === 'ADMIN_APPROVED' || o.status === 'COMPLETED');
    const txns = this.getTransactions();
    const totalRevenue = orders.reduce((s, o) => s + o.companyPrice * o.items[0].quantity, 0);
    const totalFarmerPayouts = orders.reduce((s, o) => s + o.farmerPrice * o.items[0].quantity, 0);
    const commissions = txns.filter(t => t.type === 'COMMISSION' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    const subscriptionRevenue = txns.filter(t => t.type === 'SUBSCRIPTION' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    const walletBalance = txns.filter(t => t.type === 'WALLET_TOPUP' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    return { totalRevenue, totalFarmerPayouts, totalProfit: totalRevenue - totalFarmerPayouts, commissions, subscriptionRevenue, walletBalance };
  }

  getDashboardStats() {
    const farmers = this.getFarmers();
    const providers = this.getProviders();
    const orders = this.getOrders();
    const ponds = this.getPonds();
    const harvests = this.getHarvests();
    const logs = this.getLogs();
    const subs = this.getFarmerSubs();
    const finance = this.getFinanceStats();
    return {
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter(f => f.status === 'active').length,
      pendingFarmers: farmers.filter(f => f.registrationStatus === 'pending').length,
      flaggedFarmers: farmers.filter(f => f.isFlagged).length,
      totalProviders: providers.length,
      verifiedProviders: providers.filter(p => p.status === 'verified').length,
      pendingOrders: orders.filter(o => o.status === 'SENT_TO_COMPANY').length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      activePonds: ponds.filter(p => p.status === 'ACTIVE').length,
      alertPonds: ponds.filter(p => p.status === 'ALERT' || p.status === 'DISEASE_DETECTED').length,
      pendingHarvests: harvests.filter(h => h.status === 'REQUESTED').length,
      missingLogs: logs.filter(l => l.status === 'missing').length,
      flaggedLogs: logs.filter(l => l.status === 'flagged').length,
      activeSubscriptions: subs.filter(s => s.status === 'ACTIVE').length,
      subscriptionRevenue: finance.subscriptionRevenue,
      ...finance,
    };
  }

  // ─── Products ─────────────────────────────────────────────────────────────
  getProducts(): Product[] {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (stored) return JSON.parse(stored);
    const seed: Product[] = [
      { id: 'PRD-001', name: 'AquaGrow Pro Feed 2mm', category: 'Feed', description: 'High-protein pellet feed optimized for L. Vannamei shrimp post-larvae.', usageInstructions: 'Feed 3-5% of body weight, 4 times daily.', dosageInfo: '3-5% BW/day', warnings: 'Do not overfeed. Remove uneaten feed after 2 hours.', mrp: 2800, sellingPrice: 2499, discount: 11, sku: 'AGF-001', stockQty: 450, lowStockThreshold: 50, unit: 'kg', tags: ['Vannamei', 'Post-Larvae', 'Growth'], status: 'active', rating: 4.7, reviewCount: 128, soldCount: 890, speciesTarget: 'L. Vannamei', createdAt: '2025-10-01', updatedAt: '2026-04-01' },
      { id: 'PRD-002', name: 'OxyBoost Aerator 1HP', category: 'Aerator', description: 'Energy-efficient paddle-wheel aerator for pond oxygenation.', usageInstructions: 'Install at pond edge 45° angle. Run 6-8 hours in night cycle.', mrp: 12800, sellingPrice: 10999, discount: 14, sku: 'AGA-001', stockQty: 22, lowStockThreshold: 5, unit: 'unit', tags: ['Aeration', 'Energy Efficient', 'Paddle Wheel'], status: 'active', rating: 4.5, reviewCount: 42, soldCount: 67, createdAt: '2025-10-01', updatedAt: '2026-03-01' },
      { id: 'PRD-003', name: 'WhiteSpot Shield Medicine', category: 'Medicine', description: 'Broad-spectrum antiviral treatment for White Spot Syndrome (WSSV).', dosageInfo: '1ml per 1000L water. Repeat after 48 hrs.', warnings: 'Quarantine treated ponds. Avoid contact with eyes.', mrp: 3200, sellingPrice: 2799, discount: 13, sku: 'AGM-001', stockQty: 8, lowStockThreshold: 20, unit: 'litre', tags: ['WSSV', 'Antiviral', 'Emergency'], status: 'out_of_stock', rating: 4.8, reviewCount: 56, soldCount: 234, createdAt: '2025-11-01', updatedAt: '2026-04-10' },
      { id: 'PRD-004', name: 'SmartDO Sensor v2', category: 'IoT Device', description: 'Real-time dissolved oxygen monitoring with mobile alerts.', usageInstructions: 'Submerge probe 30cm. Calibrate before first use.', mrp: 9800, sellingPrice: 8499, discount: 13, sku: 'AGI-001', stockQty: 34, lowStockThreshold: 10, unit: 'unit', tags: ['IoT', 'Oxygen', 'Real-time', 'Alert'], status: 'active', rating: 4.6, reviewCount: 29, soldCount: 48, createdAt: '2025-12-01', updatedAt: '2026-02-01' },
      { id: 'PRD-005', name: 'PondBalance Ph Regulator', category: 'Chemical', description: 'pH adjustment solution for shrimp pond water management.', dosageInfo: '500ml per acre to raise pH by 0.5 units.', warnings: 'Do not mix with chlorine-based products.', mrp: 980, sellingPrice: 799, discount: 18, sku: 'AGC-001', stockQty: 210, lowStockThreshold: 30, unit: 'litre', tags: ['pH', 'Water Quality', 'Chemistry'], status: 'active', rating: 4.3, reviewCount: 78, soldCount: 445, createdAt: '2026-01-01', updatedAt: '2026-04-01' },
      { id: 'PRD-006', name: 'Vannamei Finisher Feed 4mm', category: 'Feed', description: 'High-energy pellet for harvest-stage shrimp.', dosageInfo: '4-6% BW/day. 3 feedings daily.', mrp: 3100, sellingPrice: 2749, discount: 11, sku: 'AGF-002', stockQty: 180, lowStockThreshold: 40, unit: 'kg', tags: ['Finisher', 'Growth', 'Vannamei'], status: 'active', rating: 4.6, reviewCount: 65, soldCount: 312, speciesTarget: 'L. Vannamei', createdAt: '2026-01-01', updatedAt: '2026-04-01' },
    ];
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(seed));
    return seed;
  }

  saveProduct(product: Product): void {
    const all = this.getProducts();
    const idx = all.findIndex(p => p.id === product.id);
    if (idx >= 0) all[idx] = product; else all.unshift(product);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(all));
  }

  deleteProduct(id: string): void {
    const all = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(all));
  }

  updateStock(id: string, qty: number): void {
    const all = this.getProducts();
    const p = all.find(x => x.id === id);
    if (p) { p.stockQty = qty; p.status = qty === 0 ? 'out_of_stock' : 'active'; p.updatedAt = new Date().toISOString().split('T')[0]; }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(all));
  }

  // ─── Suppliers ────────────────────────────────────────────────────────────
  getSuppliers(): Supplier[] {
    const stored = localStorage.getItem(KEYS.SUPPLIERS);
    if (stored) return JSON.parse(stored);
    const seed: Supplier[] = [
      { id: 'SUP-001', name: 'FeedMaster India', contact: 'Ramesh Iyer', phone: '+91 98001 11001', email: 'ramesh@feedmaster.in', location: 'Chennai, TN', categories: ['Feed'], performanceScore: 94, totalProducts: 8, status: 'active', paymentTerms: 'Net 30', createdAt: '2025-09-01' },
      { id: 'SUP-002', name: 'BioMed Aqua', contact: 'Priya Sharma', phone: '+91 98001 22002', email: 'priya@biomed.in', location: 'Hyderabad, TS', categories: ['Medicine', 'Chemical'], performanceScore: 88, totalProducts: 14, status: 'active', paymentTerms: 'Net 15', createdAt: '2025-10-01' },
      { id: 'SUP-003', name: 'SmartAqua Devices', contact: 'Arjun Mehta', phone: '+91 98001 33003', location: 'Pune, MH', categories: ['IoT Device', 'Aerator', 'Equipment'], performanceScore: 91, totalProducts: 12, status: 'active', paymentTerms: 'Advance', createdAt: '2025-11-01' },
    ];
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(seed));
    return seed;
  }

  saveSupplier(s: Supplier): void {
    const all = this.getSuppliers();
    const idx = all.findIndex(x => x.id === s.id);
    if (idx >= 0) all[idx] = s; else all.unshift(s);
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(all));
  }

  deleteSupplier(id: string): void {
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(this.getSuppliers().filter(s => s.id !== id)));
  }

  // ─── Shop Orders ──────────────────────────────────────────────────────────
  getShopOrders(): ShopOrder[] {
    const stored = localStorage.getItem(KEYS.SHOP_ORDERS);
    if (stored) return JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    const seed: ShopOrder[] = [
      { id: 'SHO-001', farmerId: 'F-101', farmerName: 'John Doe', items: [{ productId: 'PRD-001', productName: 'AquaGrow Pro Feed 2mm', category: 'Feed', quantity: 50, unit: 'kg', pricePerUnit: 2499, totalPrice: 124950 }], totalAmount: 124950, discountAmount: 0, finalAmount: 125450, paymentMethod: 'UPI', paymentStatus: 'PAID', status: 'DELIVERED', deliveryAddress: 'Zone A Farm', deliveryCharge: 500, trackingId: 'TRK-001', estimatedDelivery: '2026-04-15', deliveredAt: '2026-04-14', createdAt: today, updatedAt: today },
      { id: 'SHO-002', farmerId: 'F-102', farmerName: 'Jane Smith', items: [{ productId: 'PRD-003', productName: 'WhiteSpot Shield Medicine', category: 'Medicine', quantity: 2, unit: 'litre', pricePerUnit: 2799, totalPrice: 5598 }], totalAmount: 5598, discountAmount: 0, finalAmount: 5898, paymentMethod: 'COD', paymentStatus: 'PENDING', status: 'SHIPPED', deliveryAddress: 'Zone B Farm', deliveryCharge: 300, trackingId: 'TRK-002', estimatedDelivery: today, createdAt: today, updatedAt: today },
      { id: 'SHO-003', farmerId: 'F-103', farmerName: 'Mike Ross', items: [{ productId: 'PRD-004', productName: 'SmartDO Sensor v2', category: 'IoT Device', quantity: 2, unit: 'unit', pricePerUnit: 8499, totalPrice: 16998 }], totalAmount: 16998, discountAmount: 800, finalAmount: 17498, paymentMethod: 'CARD', paymentStatus: 'PAID', status: 'CONFIRMED', deliveryAddress: 'Zone A – Ross Farm', deliveryCharge: 500, createdAt: today, updatedAt: today },
      { id: 'SHO-004', farmerId: 'F-101', farmerName: 'John Doe', items: [{ productId: 'PRD-002', productName: 'OxyBoost Aerator 1HP', category: 'Aerator', quantity: 1, unit: 'unit', pricePerUnit: 10999, totalPrice: 10999 }], totalAmount: 10999, discountAmount: 0, finalAmount: 11499, paymentMethod: 'UPI', paymentStatus: 'PENDING', status: 'PENDING', deliveryAddress: 'Zone A Farm', deliveryCharge: 500, createdAt: today, updatedAt: today },
    ];
    localStorage.setItem(KEYS.SHOP_ORDERS, JSON.stringify(seed));
    return seed;
  }

  saveShopOrder(order: ShopOrder): void {
    const all = this.getShopOrders();
    const idx = all.findIndex(o => o.id === order.id);
    if (idx >= 0) all[idx] = order; else all.unshift(order);
    localStorage.setItem(KEYS.SHOP_ORDERS, JSON.stringify(all));
  }

  updateShopOrderStatus(id: string, status: ShopOrder['status'], extra?: Partial<ShopOrder>): void {
    const all = this.getShopOrders();
    const o = all.find(x => x.id === id);
    if (o) { Object.assign(o, { status, updatedAt: new Date().toISOString().split('T')[0], ...extra }); }
    localStorage.setItem(KEYS.SHOP_ORDERS, JSON.stringify(all));
  }

  // ─── Product Reviews ──────────────────────────────────────────────────────
  getReviews(): ProductReview[] {
    const stored = localStorage.getItem(KEYS.REVIEWS);
    if (stored) return JSON.parse(stored);
    const seed: ProductReview[] = [
      { id: 'REV-001', productId: 'PRD-001', productName: 'AquaGrow Pro Feed 2mm', farmerId: 'F-101', farmerName: 'John Doe', rating: 5, comment: 'Excellent feed. Shrimp growth improved significantly after switching to this.', isApproved: true, createdAt: '2026-04-10' },
      { id: 'REV-002', productId: 'PRD-002', productName: 'OxyBoost Aerator 1HP', farmerId: 'F-103', farmerName: 'Mike Ross', rating: 4, comment: 'Good aerator, quiet motor. Bit expensive but worth it.', isApproved: true, createdAt: '2026-04-05' },
      { id: 'REV-003', productId: 'PRD-003', productName: 'WhiteSpot Shield Medicine', farmerId: 'F-102', farmerName: 'Jane Smith', rating: 2, comment: 'This is amazing!!!! Buy now!!!! Best product ever!!!!', isFake: true, isApproved: false, createdAt: '2026-04-12' },
    ];
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(seed));
    return seed;
  }

  approveReview(id: string): void {
    const all = this.getReviews();
    const r = all.find(x => x.id === id);
    if (r) r.isApproved = true;
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(all));
  }

  flagReview(id: string): void {
    const all = this.getReviews();
    const r = all.find(x => x.id === id);
    if (r) { r.isFake = true; r.isApproved = false; }
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(all));
  }

  deleteReview(id: string): void {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(this.getReviews().filter(r => r.id !== id)));
  }

  // ─── Delivery Zones ───────────────────────────────────────────────────────
  getDeliveryZones(): DeliveryZone[] {
    const stored = localStorage.getItem(KEYS.DELIVERY_ZONES);
    if (stored) return JSON.parse(stored);
    const seed: DeliveryZone[] = [
      { id: 'DZ-001', name: 'Zone A Local', charge: 299, estimatedDays: 1, regions: ['Zone A'], isActive: true },
      { id: 'DZ-002', name: 'Zone B Standard', charge: 499, estimatedDays: 2, regions: ['Zone B', 'Zone C'], isActive: true },
      { id: 'DZ-003', name: 'Remote Delivery', charge: 799, estimatedDays: 4, regions: ['Remote'], isActive: true },
    ];
    localStorage.setItem(KEYS.DELIVERY_ZONES, JSON.stringify(seed));
    return seed;
  }

  // ── Employee Management ──────────────────────────────────────────────────────
  getEmployeeTargets() { return this.get<EmployeeTarget>(KEYS.EMPLOYEE_TARGETS, SEED_EMP_TARGETS); }
  saveEmployeeTarget(t: EmployeeTarget) { this.upsert(KEYS.EMPLOYEE_TARGETS, SEED_EMP_TARGETS, t); }

  getEmployeeVisits() { return this.get<EmployeeVisit>(KEYS.EMPLOYEE_VISITS, SEED_EMP_VISITS); }
  saveEmployeeVisit(v: EmployeeVisit) { this.upsert(KEYS.EMPLOYEE_VISITS, SEED_EMP_VISITS, v); }

  getEmployeeTasks() { return this.get<EmployeeTask>(KEYS.EMPLOYEE_TASKS, SEED_EMP_TASKS); }
  saveEmployeeTask(t: EmployeeTask) { this.upsert(KEYS.EMPLOYEE_TASKS, SEED_EMP_TASKS, t); }
  deleteEmployeeTask(id: string) { this.remove(KEYS.EMPLOYEE_TASKS, SEED_EMP_TASKS, id); }

  getEmployeeExpenses() { return this.get<EmployeeExpense>(KEYS.EMPLOYEE_EXPENSES, SEED_EMP_EXPENSES); }
  saveEmployeeExpense(e: EmployeeExpense) { this.upsert(KEYS.EMPLOYEE_EXPENSES, SEED_EMP_EXPENSES, e); }
  approveExpense(id: string) {
    const list = this.getEmployeeExpenses();
    const e = list.find(x => x.id === id);
    if (e) { e.status = 'APPROVED'; this.set(KEYS.EMPLOYEE_EXPENSES, list); }
  }

  getEmployeeAttendance() { return this.get<EmployeeAttendance>(KEYS.EMPLOYEE_ATTENDANCE, SEED_EMP_ATTENDANCE); }
  saveEmployeeAttendance(a: EmployeeAttendance) { this.upsert(KEYS.EMPLOYEE_ATTENDANCE, SEED_EMP_ATTENDANCE, a); }

  getEmployeeTrainings() { return this.get<EmployeeTraining>(KEYS.EMPLOYEE_TRAININGS, SEED_EMP_TRAININGS); }
  saveEmployeeTraining(t: EmployeeTraining) { this.upsert(KEYS.EMPLOYEE_TRAININGS, SEED_EMP_TRAININGS, t); }
}

export const storageService = new StorageService();
