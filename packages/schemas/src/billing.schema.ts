export interface WholesaleUsageStatsContract {
  totalOutboundMessages: number;
  wholesaleRate: number;
  totalCost: number;
}

export interface SubAccountContract {
  id: string;
  name: string;
  slug: string;
}

export interface WholesaleUsageContract {
  agencyWorkspaceId: string;
  agencyName: string;
  subAccountsCount: number;
  subAccountsList: SubAccountContract[];
  usageStats: WholesaleUsageStatsContract;
}

export interface InvoiceContract {
  _id: string;
  action: string;
  createdAt: string;
  details: {
    paymentGateway?: string;
    amount?: number;
    gstApplied?: string;
    notes?: string;
  };
}
