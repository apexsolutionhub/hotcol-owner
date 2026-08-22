export type Owner = {
  id: number;
  UserName: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  propertyCount: number;
};

export type ModuleChangeRequest = {
  id: number;
  tinNumber: string;
  status: string;
  requestedBySide: string;
  requestNote: string | null;
  requestedModules: string[] | null;
  createdAt: string;
};

export type OwnerProperty = {
  tinNumber: string;
  label: string | null;
  hotelDisplayName: string;
  businessType: string | null;
  logoUrl: string | null;
  accountStatus: string;
  subscriptionStatus: string;
  accessBlocked: boolean;
  accessBlockReason: string | null;
  modules: string[] | null;
  todayRevenueETB: number;
  monthRevenueETB: number;
  openOrders: number;
  pendingApprovals: number;
  staffCount: number;
  needsAttention: boolean;
  occupancyPct: number | null;
  vacantDirty: number | null;
  openCmAssignments: number | null;
  activeStays: number | null;
};

export type PortfolioSummary = {
  propertyCount: number;
  todayRevenueETB: number;
  monthRevenueETB: number;
  openOrders: number;
  pendingApprovals: number;
  attentionCount: number;
  occupiedRooms: number;
  openCmJobs: number;
  properties: OwnerProperty[];
};

export type CategoryRevenue = { label: string; revenueETB: number };

export type RevenueSnapshot = {
  todayRevenueETB: number;
  monthRevenueETB: number;
  todayOrders: number;
  todayCashETB: number;
  todayBankETB: number;
  todayCreditETB: number;
  categories: CategoryRevenue[];
};

export type CafeProfitSnapshot = {
  todayRevenueETB: number;
  todayIngredientCostETB: number;
  todayProfitETB: number;
  todayMarginPct: number;
  monthRevenueETB: number;
  monthIngredientCostETB: number;
  monthProfitETB: number;
  monthMarginPct: number;
  linesWithRecipe: number;
  paidLines: number;
  recipeCoveragePct: number;
  menuItemsWithRecipe: number;
  menuItemCount: number;
};

export type DailyCafePoint = {
  date: string;
  label: string;
  revenueETB: number;
  ingredientCostETB: number;
  profitETB: number;
  orders: number;
};

export type CategoryProfit = {
  label: string;
  revenueETB: number;
  ingredientCostETB: number;
  profitETB: number;
};

export type CafeSoldRanking = {
  label: string;
  quantity: number;
  revenueETB: number;
  profitETB: number;
};

export type CafeOrderSummary = {
  totalLines: number;
  completed: number;
  completedETB: number;
  cancelled: number;
  cancelledETB: number;
  pendingPayment: number;
  pendingPaymentETB: number;
  expired: number;
  expiredETB: number;
};

export type CafeAnalytics = {
  profit: CafeProfitSnapshot;
  dailyTrend: DailyCafePoint[];
  topCategories: CategoryProfit[];
  topSoldByCategory: CafeSoldRanking[];
  topSoldByType: CafeSoldRanking[];
  topSoldItems: CafeSoldRanking[];
  orderSummary: CafeOrderSummary;
};

export type CafePeriodReport = {
  period: "Daily" | "Monthly" | string;
  date: string;
  label: string;
  revenueETB: number;
  ingredientCostETB: number;
  profitETB: number;
  marginPct: number;
  cashETB: number;
  bankETB: number;
  creditETB: number;
  paidLines: number;
  linesWithRecipe: number;
  recipeCoveragePct: number;
  menuItemsWithRecipe: number;
  menuItemCount: number;
  categories: CategoryProfit[];
  topSoldByCategory: CafeSoldRanking[];
  topSoldByType: CafeSoldRanking[];
  topSoldItems: CafeSoldRanking[];
  orderSummary: CafeOrderSummary;
  trend: DailyCafePoint[];
};

export type ApprovalPipelineCounts = {
  pendingCC: number;
  checkedCC: number;
  pendingFinance: number;
  pendingManager: number;
  authorized: number;
};

export type OperationalSnapshot = {
  staffCount: number;
  ordersToday: number;
  openOrders: number;
  pendingPurchaseRequests: number;
  pendingStockOutRequests: number;
  pendingItemRegistrations: number;
  purchaseRequestPipeline: ApprovalPipelineCounts | null;
  stockOutRequestPipeline: ApprovalPipelineCounts | null;
  itemRegistrationPipeline: ApprovalPipelineCounts | null;
};

export type LodgingSnapshot = {
  vacantClean: number;
  vacantDirty: number;
  occupied: number;
  onMaintenance: number;
  totalRooms: number;
  activeStays: number;
  reservedStays: number;
  openCmAssignments: number;
  openCleaning: number;
  openMaintenance: number;
  occupancyPct: number;
  readyPct: number;
  todayRoomRevenueETB: number;
  todayFoodDrinkETB: number;
  todayLaundryETB: number;
  todayOtherServicesETB: number;
  monthStayRevenueETB: number;
  openFolioETB: number;
  checkInsToday: number;
  checkOutsToday: number;
  roomServiceOpenOrders: number;
  roomServiceOrdersToday: number;
};

export type CafeOpsSnapshot = {
  menuItemCount: number;
  tableCount: number;
  waiterCount: number;
  cancelledToday: number;
};

export type ModuleHealthMetric = { label: string; value: string };

export type ModuleHealth = {
  module: string;
  label: string;
  score: number;
  alertLevel: string;
  summary: string;
  metrics: ModuleHealthMetric[];
};

export type BillingInfo = {
  subscriptionStatus: string;
  setupFeeETB: number;
  quarterlyFeeETB: number;
  renewalAmountETB: number;
  renewalKind: string;
  setupFeeApproved: boolean;
  subscriptionPaymentApproved: boolean;
  subscriptionPaidUntil: string | null;
  paidQuartersCount: number;
  billingHold: boolean;
  isIllustrationTenant: boolean;
  freeTrialEndsAt: string | null;
  pendingPaymentKind: string | null;
};

export type PropertyDashboard = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  logoUrl: string | null;
  accountStatus: string;
  subscriptionStatus: string;
  accessBlocked: boolean;
  accessBlockReason: string | null;
  modules: string[] | null;
  allowedRoles: string[];
  revenue: RevenueSnapshot;
  operational: OperationalSnapshot;
  lodging: LodgingSnapshot | null;
  cafeOps: CafeOpsSnapshot | null;
  cafeAnalytics: CafeAnalytics | null;
  moduleHealth: ModuleHealth[];
  billing: BillingInfo;
};

export type StaffMember = {
  id: number;
  UserName: string;
  Role: string;
  loginDisabled: boolean;
  loginDisabledReason: string | null;
  createdAt: string | null;
};

export type WaiterRow = {
  id: number;
  name: string;
  sex: string | null;
  age: number | null;
  experience: number | null;
  phoneNumber: string | null;
  completedOrders: number;
  totalSalesETB: number;
};

export type InventoryItem = {
  id: number;
  name: string;
  category: string | null;
  amount: number;
  measuredBy: string | null;
  unitPrice: number;
  totalValueETB: number;
  expireDate: string | null;
  supplierName: string | null;
  approvalStatus: string | null;
};

export type InventorySummary = {
  itemCount: number;
  totalValueETB: number;
  expiringSoon: number;
  items: InventoryItem[];
};

export type PaymentRow = {
  id: number;
  tinNumber: string;
  paymentKind: string;
  amountETB: number;
  paymentChannel: string;
  transactionRef: string;
  status: string;
  submittedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  quarterNumber: number | null;
};

export type DepartmentLeaderRow = {
  id: number;
  department: string;
  departmentLabel: string;
  leaderName: string;
};

export type CostControllerRow = {
  id: number;
  displayName: string;
  createdAt: string | null;
};

export type InventoryPeopleSummary = {
  departmentLeaders: DepartmentLeaderRow[];
  costControllers: CostControllerRow[];
};
