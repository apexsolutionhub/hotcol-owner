import { gql } from "./api";
import type {
  CafePeriodReport,
  InventoryPeopleSummary,
  InventorySummary,
  ModuleChangeRequest,
  Owner,
  PaymentRow,
  PortfolioSummary,
  PropertyDashboard,
  StaffMember,
  WaiterRow,
} from "./types";

const OWNER_FIELDS = `
  id UserName displayName phone email propertyCount
`;

export async function loginRequest(
  UserName: string,
  Password: string,
): Promise<{ token: string; owner: Owner }> {
  const data = await gql<{ ownerLogin: { token: string; owner: Owner } }>(
    `mutation OwnerLogin($UserName: String!, $Password: String!) {
      ownerLogin(UserName: $UserName, Password: $Password) {
        token
        owner { ${OWNER_FIELDS} }
      }
    }`,
    { UserName, Password },
  );
  return data.ownerLogin;
}

export async function fetchOwnerMe(): Promise<Owner | null> {
  const data = await gql<{ ownerMe: Owner | null }>(
    `query OwnerMe { ownerMe { ${OWNER_FIELDS} } }`,
  );
  return data.ownerMe;
}

export async function fetchPortfolio(): Promise<PortfolioSummary> {
  const data = await gql<{ portfolio: PortfolioSummary }>(
    `query Portfolio {
      portfolio {
        propertyCount
        todayRevenueETB
        monthRevenueETB
        openOrders
        pendingApprovals
        attentionCount
        occupiedRooms
        openCmJobs
        properties {
          tinNumber label hotelDisplayName businessType logoUrl
          accountStatus subscriptionStatus accessBlocked accessBlockReason modules
          todayRevenueETB monthRevenueETB openOrders pendingApprovals staffCount
          needsAttention occupancyPct vacantDirty openCmAssignments activeStays
        }
      }
    }`,
  );
  return data.portfolio;
}

export async function fetchPropertyDashboard(
  tinNumber: string,
): Promise<PropertyDashboard | null> {
  const data = await gql<{ propertyDashboard: PropertyDashboard | null }>(
    `query PropertyDashboard($tinNumber: String!) {
      propertyDashboard(tinNumber: $tinNumber) {
        tinNumber hotelDisplayName businessType logoUrl
        accountStatus subscriptionStatus accessBlocked accessBlockReason modules allowedRoles
        revenue {
          todayRevenueETB monthRevenueETB todayOrders
          todayCashETB todayBankETB todayCreditETB
          categories { label revenueETB }
        }
        operational {
          staffCount ordersToday openOrders
          pendingPurchaseRequests pendingStockOutRequests pendingItemRegistrations
          purchaseRequestPipeline { pendingCC checkedCC pendingFinance pendingManager authorized }
          stockOutRequestPipeline { pendingCC checkedCC pendingFinance pendingManager authorized }
          itemRegistrationPipeline { pendingCC checkedCC pendingFinance pendingManager authorized }
        }
        lodging {
          vacantClean vacantDirty occupied onMaintenance totalRooms
          activeStays reservedStays openCmAssignments openCleaning openMaintenance
          occupancyPct readyPct
          todayRoomRevenueETB todayFoodDrinkETB todayLaundryETB todayOtherServicesETB
          monthStayRevenueETB openFolioETB
          checkInsToday checkOutsToday
          roomServiceOpenOrders roomServiceOrdersToday
        }
        cafeOps {
          menuItemCount tableCount waiterCount cancelledToday
        }
        moduleHealth {
          module label score alertLevel summary
          metrics { label value }
        }
        billing {
          subscriptionStatus setupFeeETB quarterlyFeeETB renewalAmountETB renewalKind
          setupFeeApproved subscriptionPaymentApproved subscriptionPaidUntil
          paidQuartersCount billingHold isIllustrationTenant freeTrialEndsAt
          pendingPaymentKind
        }
      }
    }`,
    { tinNumber },
  );
  return data.propertyDashboard;
}

export async function fetchPropertyCafeReport(
  tinNumber: string,
  period: "Daily" | "Monthly",
  date: string,
): Promise<CafePeriodReport> {
  const data = await gql<{ propertyCafeReport: CafePeriodReport }>(
    `query PropertyCafeReport($tinNumber: String!, $period: String!, $date: String!) {
      propertyCafeReport(tinNumber: $tinNumber, period: $period, date: $date) {
        period date label
        revenueETB ingredientCostETB profitETB marginPct
        cashETB bankETB creditETB
        paidLines linesWithRecipe recipeCoveragePct
        menuItemsWithRecipe menuItemCount
        categories { label revenueETB ingredientCostETB profitETB }
        topSoldByCategory { label quantity revenueETB profitETB }
        topSoldByType { label quantity revenueETB profitETB }
        topSoldItems { label quantity revenueETB profitETB }
        orderSummary {
          totalLines completed completedETB cancelled cancelledETB
          pendingPayment pendingPaymentETB expired expiredETB
        }
        trend { date label revenueETB ingredientCostETB profitETB orders }
      }
    }`,
    { tinNumber, period, date },
  );
  return data.propertyCafeReport;
}

export async function fetchPropertyStaff(tinNumber: string): Promise<StaffMember[]> {
  const data = await gql<{ propertyStaff: StaffMember[] }>(
    `query PropertyStaff($tinNumber: String!) {
      propertyStaff(tinNumber: $tinNumber) {
        id UserName Role loginDisabled loginDisabledReason createdAt
      }
    }`,
    { tinNumber },
  );
  return data.propertyStaff;
}

export async function fetchPropertyWaiters(tinNumber: string): Promise<WaiterRow[]> {
  const data = await gql<{ propertyWaiters: WaiterRow[] }>(
    `query PropertyWaiters($tinNumber: String!) {
      propertyWaiters(tinNumber: $tinNumber) {
        id name sex age experience phoneNumber completedOrders totalSalesETB
      }
    }`,
    { tinNumber },
  );
  return data.propertyWaiters;
}

export async function fetchPropertyInventoryPeople(
  tinNumber: string,
): Promise<InventoryPeopleSummary> {
  const data = await gql<{ propertyInventoryPeople: InventoryPeopleSummary }>(
    `query PropertyInventoryPeople($tinNumber: String!) {
      propertyInventoryPeople(tinNumber: $tinNumber) {
        departmentLeaders { id department departmentLabel leaderName }
        costControllers { id displayName createdAt }
      }
    }`,
    { tinNumber },
  );
  return data.propertyInventoryPeople;
}

export async function fetchPropertyInventory(
  tinNumber: string,
): Promise<InventorySummary> {
  const data = await gql<{ propertyInventory: InventorySummary }>(
    `query PropertyInventory($tinNumber: String!) {
      propertyInventory(tinNumber: $tinNumber, limit: 150) {
        itemCount totalValueETB expiringSoon
        items {
          id name category amount measuredBy unitPrice totalValueETB
          expireDate supplierName approvalStatus
        }
      }
    }`,
    { tinNumber },
  );
  return data.propertyInventory;
}

export async function fetchPropertyPayments(
  tinNumber: string,
): Promise<PaymentRow[]> {
  const data = await gql<{ propertyPayments: PaymentRow[] }>(
    `query PropertyPayments($tinNumber: String!) {
      propertyPayments(tinNumber: $tinNumber, limit: 30) {
        id tinNumber paymentKind amountETB paymentChannel transactionRef
        status submittedAt approvedAt rejectedAt rejectionReason quarterNumber
      }
    }`,
    { tinNumber },
  );
  return data.propertyPayments;
}

export async function createStaffRequest(input: {
  tinNumber: string;
  UserName: string;
  Password: string;
  Role: string;
}): Promise<StaffMember> {
  const data = await gql<{ ownerCreateStaff: StaffMember }>(
    `mutation OwnerCreateStaff(
      $tinNumber: String!, $UserName: String!, $Password: String!, $Role: String!
    ) {
      ownerCreateStaff(
        tinNumber: $tinNumber, UserName: $UserName, Password: $Password, Role: $Role
      ) { id UserName Role loginDisabled loginDisabledReason createdAt }
    }`,
    input,
  );
  return data.ownerCreateStaff;
}

export async function setStaffPasswordRequest(
  userId: number,
  Password: string,
): Promise<boolean> {
  const data = await gql<{ ownerSetStaffPassword: boolean }>(
    `mutation SetStaffPassword($userId: Int!, $Password: String!) {
      ownerSetStaffPassword(userId: $userId, Password: $Password)
    }`,
    { userId, Password },
  );
  return data.ownerSetStaffPassword;
}

export async function setStaffLoginDisabledRequest(
  userId: number,
  disabled: boolean,
  reason?: string,
): Promise<boolean> {
  const data = await gql<{ ownerSetStaffLoginDisabled: boolean }>(
    `mutation SetStaffLoginDisabled($userId: Int!, $disabled: Boolean!, $reason: String) {
      ownerSetStaffLoginDisabled(userId: $userId, disabled: $disabled, reason: $reason)
    }`,
    { userId, disabled, reason },
  );
  return data.ownerSetStaffLoginDisabled;
}

export async function submitSubscriptionPaymentRequest(input: {
  tinNumber: string;
  paymentKind: string;
  paymentChannel: string;
  transactionRef: string;
}): Promise<PaymentRow> {
  const data = await gql<{ ownerSubmitSubscriptionPayment: PaymentRow }>(
    `mutation SubmitPayment(
      $tinNumber: String!, $paymentKind: String!, $paymentChannel: String!, $transactionRef: String!
    ) {
      ownerSubmitSubscriptionPayment(
        tinNumber: $tinNumber, paymentKind: $paymentKind,
        paymentChannel: $paymentChannel, transactionRef: $transactionRef
      ) {
        id tinNumber paymentKind amountETB paymentChannel transactionRef
        status submittedAt approvedAt rejectedAt rejectionReason quarterNumber
      }
    }`,
    input,
  );
  return data.ownerSubmitSubscriptionPayment;
}

export async function changeOwnerPasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const data = await gql<{ ownerChangePassword: boolean }>(
    `mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
      ownerChangePassword(currentPassword: $currentPassword, newPassword: $newPassword)
    }`,
    { currentPassword, newPassword },
  );
  return data.ownerChangePassword;
}

export async function requestOwnerModuleChange(input: {
  tinNumber: string;
  changeType: "add" | "remove";
  modules: string[];
  requestNote?: string;
}): Promise<ModuleChangeRequest> {
  const data = await gql<{ ownerRequestModuleChange: ModuleChangeRequest }>(
    `mutation OwnerRequestModuleChange(
      $tinNumber: String!
      $changeType: String!
      $modules: JSON!
      $requestNote: String
    ) {
      ownerRequestModuleChange(
        tinNumber: $tinNumber
        changeType: $changeType
        modules: $modules
        requestNote: $requestNote
      ) {
        id tinNumber status requestedBySide requestNote requestedModules createdAt
      }
    }`,
    input,
  );
  return data.ownerRequestModuleChange;
}
