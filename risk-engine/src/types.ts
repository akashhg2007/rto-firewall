export interface RiskInput {
  pincode: string;
  name?: string;
  email?: string;
  device?: string;
  time?: number;
  productCategory?: string;
  merchantId?: string;
}

export interface RiskOutput {
  score: number;
  action: "allow" | "block";
  reasons: Reason[];
  breakdown: ScoreBreakdown;
}

export interface Reason {
  code: string;
  label: string;
  weight: number;
}

export interface ScoreBreakdown {
  pincode: number;
  name: number;
  device: number;
  time: number;
  product: number;
}

export interface PincodeRTO {
  pincode: string;
  district: string;
  state: string;
  rtoRate: number;
}

export interface MerchantConfig {
  merchantId: string;
  threshold: number;
  discountPercent: number;
  productRiskMap: Record<string, number>;
}

export interface ShippingInfoRequest {
  order_id: string;
  razorpay_order_id: string;
  email?: string;
  contact: string;
  addresses: Array<{
    id: string;
    zipcode: string;
    state_code?: string;
    country: string;
  }>;
}

export interface ShippingInfoResponse {
  addresses: Array<{
    id: string;
    zipcode: string;
    country: string;
    shipping_methods: Array<{
      id: string;
      name: string;
      description?: string;
      serviceable: boolean;
      shipping_fee: number;
      cod: boolean;
      cod_fee: number;
    }>;
  }>;
}

export interface PromotionsRequest {
  order_id: string;
  razorpay_order_id: string;
  email?: string;
  contact?: string;
  address_id?: string;
  coupon_code?: string;
}

export interface AuditEntry {
  orderId: string;
  timestamp: number;
  pincode: string;
  name?: string;
  email?: string;
  score: number;
  action: "allow" | "block";
  reasons: Reason[];
  outcome?: "delivered" | "rto" | "converted" | "pending";
}

export interface DashboardStats {
  analyzed: number;
  blocked: number;
  moneySaved: number;
  converted: number;
  recoveredAmount: number;
  falsePositives: number;
}

export interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment?: { entity: { order_id: string; status: string; method: string } };
    order?: { entity: { id: string; status: string; amount: number } };
  };
}

export interface Env {
  RTO_DATA: KVNamespace;
  RISK_THRESHOLD: string;
  PREPAID_DISCOUNT_PERCENT: string;
  NATIONAL_RTO_AVERAGE: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}
