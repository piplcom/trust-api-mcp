/**
 * Trust API TypeScript Type Definitions
 * Complete type definitions for all Trust API data objects, requests, and responses
 */

// ============= Base Data Types =============

export interface NameObject {
  raw?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  prefix?: string;
  suffix?: string;
}

export interface EmailObject {
  address: string;
  verified?: boolean;
}

export interface PhoneObject {
  raw?: string;
  country_code?: string | number;
  number?: string | number;
  extension?: string | number;
  verified?: boolean;
}

export interface AddressObject {
  raw?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  house?: string;
  po_box?: string;
  zip_code?: string;
}

export interface PersonObject {
  dob?: string;
  gender?: 'M' | 'F';
}

export interface PersonalIdentifierObject {
  type: string; // CPF, SSN, DIN, CURP, etc.
  value: string;
  country?: string;
  issue_date?: string;
  expiry_date?: string;
}

// ============= Account Object =============

export interface AccountObject {
  created?: string;
  id?: string;
  ip_created?: string;
  ip_history?: string[];
  ip_last?: string;
  active?: boolean;
  // Account can also contain other primary data objects
  name?: NameObject;
  email?: EmailObject;
  phone?: PhoneObject;
  address?: AddressObject;
  person?: PersonObject;
  personal_identifier?: PersonalIdentifierObject;
}

// ============= Device Object =============

export interface DeviceObject {
  ip?: string;
  true_ip?: string;
  aaid?: string;
  adid?: string;
  identifier?: string;
  imei?: string | number;
  imsi?: string | number;
  udid?: string;
  iccid?: string;
  eid?: string | number;
  seid?: string;
  bluetooth_mac_address?: string;
  wifi_mac_address?: string;
  wifi_bssid?: string;
  wifi_ssid?: string;
  wifi_security?: string;
  battery_level?: number;
  is_battery_charging?: boolean;
  accessories?: number;
  camera_megapixel?: number;
  cpu_cores?: number;
  cpu_model?: string;
  gpu_name?: string;
  gpu_vendor?: string;
  is_css_image?: boolean;
  is_developer_settings?: boolean;
  is_display_zoom?: boolean;
  is_ds_card?: boolean;
  is_emulator?: boolean;
  is_guided_access?: boolean;
  is_low_power_mode?: boolean;
  is_mobile?: boolean;
  is_nfc_enabled?: boolean;
  is_pencil?: boolean;
  is_rooted?: boolean;
  is_screen_touch?: boolean;
  is_virtual_env?: boolean;
  language?: string;
  local_language?: string;
  latitude?: string;
  longitude?: string;
  memory?: number;
  name?: string;
  os?: string;
  os_version?: string;
  ringer?: string;
  screen_brightness?: string;
  screen_dpi?: number;
  screen_height?: number;
  screen_width?: number;
  screen_ppi?: number;
  screen_resolution?: string;
  storage_capacity?: number;
  storage_free?: number;
  total_applications?: number;
  unlock_type?: string;
}

// ============= Additional Data Objects =============

export interface BrowserObject {
  accept_language?: string;
  canvas?: number;
  charset?: string;
  device?: 'mobile' | 'desktop';
  history_urls?: number;
  is_cookies_enabled?: boolean;
  is_incognito_mode?: boolean;
  is_js_enabled?: boolean;
  name?: string;
  preferred_language?: string;
  timezone_offset?: number;
  user_agent?: string;
  version?: string;
}

export interface CardObject {
  avs?: string;
  bin?: number;
  brand?: string;
  corporate?: boolean;
  country?: string;
  funding?: 'C' | 'D' | 'P';
  issuer?: string;
  local_use?: boolean;
  prepaid?: boolean;
  reloadable?: boolean;
}

export interface OrderObject {
  amount?: number;
  created_at?: string;
  currency?: string;
  has_gift_message?: boolean;
  is_gift?: boolean;
  shipping_method?: 'lowcost' | 'sameday' | 'oneday' | 'twoday' | 'threeday' | 'standard' | 'pickup' | 'digital_delivery' | 'other' | 'none' | string;
  number_of_items?: number;
}

export interface PageObject {
  affiliate_id?: string;
  affiliate_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  campaign_type?: 'SEO' | 'Content' | 'Facebook' | 'Instagram' | 'Twitter' | 'Snapchat' | 'TikTok' | 'LinkedIn' | 'Pinterest' | 'Google Search' | 'Google Video' | 'Display' | 'Organic' | 'Affiliate' | string;
  medium?: string;
  previous_screen?: string;
  referral_url?: string;
  screen_id?: string;
  source?: string;
  sub_affiliate_id?: string;
  url?: string;
}

export interface PaymentObject {
  is_recurring?: boolean;
  payment_method?: 'card' | 'paypal' | 'wire transfer' | 'bitcoin' | string;
}

export interface SessionObject {
  age?: number;
  id?: string;
}

export interface LocaleObject {
  country?: string;
  region?: string;
}

export interface CustomObject {
  [key: string]: any;
}

// ============= Action Object =============

export interface ActionObject {
  type: 'signup' | 'purchase' | 'feedback' | string;
  id?: string;
  organization?: string;
}

// ============= Request Structure =============

export interface TrustRequest {
  key: string;
  action: ActionObject;
  echo_query?: boolean;
  connectivity?: boolean;
  signals?: boolean;

  // Data fields - can be at root or in groups
  account?: AccountObject;
  billing?: {
    name?: NameObject;
    email?: EmailObject;
    phone?: PhoneObject;
    address?: AddressObject;
  };
  shipping?: {
    name?: NameObject;
    email?: EmailObject;
    phone?: PhoneObject;
    address?: AddressObject;
  };
  sender?: {
    name?: NameObject | string;
    email?: EmailObject | string;
    phone?: PhoneObject | string;
    address?: AddressObject | string;
    device?: DeviceObject;
    ip?: string;
    [key: string]: any;
  };
  recipient?: {
    name?: NameObject | string;
    email?: EmailObject | string;
    phone?: PhoneObject | string;
    address?: AddressObject | string;
    device?: DeviceObject;
    ip?: string;
    [key: string]: any;
  };
  metadata?: {
    [key: string]: any;
  };

  // Individual data objects
  name?: NameObject;
  email?: EmailObject;
  phone?: PhoneObject;
  address?: AddressObject;
  person?: PersonObject;
  personal_identifier?: PersonalIdentifierObject;
  device?: DeviceObject;
  browser?: BrowserObject;
  card?: CardObject;
  order?: OrderObject;
  page?: PageObject;
  payment?: PaymentObject;
  session?: SessionObject;
  locale?: LocaleObject;
  custom?: CustomObject;
}

// ============= Trust Signals =============

export interface EmailTrustSignals {
  is_valid?: boolean;
  domain_type?: 'disposable' | 'commercial' | 'personal';
  domain_is_deliverable?: boolean;
  domain_registration_age_months?: number;
  domain_registration_age_days?: number;
  age_months?: number;
  age_days?: number;
  number_of_sources?: number;
  last_seen_months?: number;
  last_seen_days?: number;
  velocity?: number;
  volatility?: number;
  last_seen_in_breach_days?: number;
  last_seen_in_breach_months?: number;
  number_of_social_accounts?: number;
}

export interface PhoneTrustSignals {
  is_valid?: boolean;
  age_months?: number;
  age_days?: number;
  number_of_sources?: number;
  number_of_owners?: number;
  is_commercial?: boolean;
  carrier?: string;
  line_type?: 'landline' | 'mobile' | 'voip' | 'toll-free';
  voip_type?: 'fixed' | 'non_fixed';
  last_seen_months?: number;
  last_seen_days?: number;
  velocity?: number;
  volatility?: number;
  last_seen_in_breach_days?: number;
  last_seen_in_breach_months?: number;
  is_disposable?: boolean;
  number_of_social_accounts?: number;
}

export interface IPTrustSignals {
  is_valid?: boolean;
  country_code?: string;
  is_proxy?: boolean;
  is_tor?: boolean;
  is_vpn?: boolean;
  is_bot?: boolean;
  connection_type?: 'Corporate' | 'Data Center' | 'Education' | 'Mobile' | 'Residential';
  isp?: string;
  last_seen_months?: number;
  last_seen_days?: number;
  velocity?: number;
  volatility?: number;
}

export interface AddressTrustSignals {
  is_valid?: boolean;
  validity_level?: 'invalid' | 'valid_to_country' | 'valid_to_state' | 'valid_to_zip_code' | 'valid_to_city' | 'valid_to_street' | 'valid_to_house' | 'valid_to_apartment' | 'valid_to_po_box';
  is_suspicious?: boolean;
  is_normalized?: boolean;
  is_auto_corrected?: boolean;
  is_freight_forward?: boolean;
  is_commercial?: boolean;
  is_pobox?: boolean;
  last_seen_months?: number;
  last_seen_days?: number;
  velocity?: number;
  volatility?: number;
}

export interface PersonalIdentifierTrustSignals {
  is_valid?: boolean;
  is_supported?: boolean;
  age_months?: number;
  age_days?: number;
  last_seen_months?: number;
  last_seen_days?: number;
  velocity?: number;
  volatility?: number;
  person_age?: number;
  person_deceased?: boolean;
  postal_code_match?: boolean;
  gender_match?: boolean;
  issue_date_match?: boolean;
  expiry_date_match?: boolean;
}

// ============= Connectivity Data =============

export interface ConnectivityScore {
  score: number | null;
  match: boolean | null;
}

export interface DistanceInfo {
  miles: number;
  geo_accuracy: 'house' | 'street' | 'city/zip' | 'state' | 'country' | null;
}

// ============= Response Structure =============

export interface FieldResponse<T = any> {
  query_values?: T;
  score?: number;
  trust_signals?: any;
  connectivity_data?: {
    [group: string]: {
      [field: string]: ConnectivityScore;
    };
  };
  distance?: {
    [group: string]: {
      [field: string]: DistanceInfo;
    };
  };
}

export interface WarningObject {
  message: string;
  code: number;
}

export interface ErrorObject {
  message: string;
  code: number;
}

export interface TrustResponse {
  response_id: string;
  score: number;
  decision: 'approve' | 'review' | 'decline';
  warnings?: WarningObject[];
  error?: ErrorObject | null;
  action: ActionObject;
  
  // Field responses - mirrors request structure with response data
  account?: AccountFieldResponses;
  billing?: BillingFieldResponses;
  shipping?: ShippingFieldResponses;
  device?: DeviceFieldResponse;
  browser?: FieldResponse<BrowserObject>;
  card?: FieldResponse<CardObject>;
  order?: FieldResponse<OrderObject>;
  page?: FieldResponse<PageObject>;
  payment?: FieldResponse<PaymentObject>;
  session?: FieldResponse<SessionObject>;
  locale?: FieldResponse<LocaleObject>;
  custom?: FieldResponse<CustomObject>;
  
  // Individual field responses
  name?: FieldResponse<NameObject>;
  email?: FieldResponse<EmailObject>;
  phone?: FieldResponse<PhoneObject>;
  address?: FieldResponse<AddressObject>;
  person?: FieldResponse<PersonObject>;
  personal_identifier?: FieldResponse<PersonalIdentifierObject>;
}

interface AccountFieldResponses {
  query_values?: AccountObject;
  name?: FieldResponse<NameObject>;
  email?: FieldResponse<EmailObject>;
  phone?: FieldResponse<PhoneObject>;
  address?: FieldResponse<AddressObject>;
  person?: FieldResponse<PersonObject>;
  personal_identifier?: FieldResponse<PersonalIdentifierObject>;
}

interface BillingFieldResponses {
  name?: FieldResponse<NameObject>;
  email?: FieldResponse<EmailObject>;
  phone?: FieldResponse<PhoneObject>;
  address?: FieldResponse<AddressObject>;
}

interface ShippingFieldResponses {
  name?: FieldResponse<NameObject>;
  email?: FieldResponse<EmailObject>;
  phone?: FieldResponse<PhoneObject>;
  address?: FieldResponse<AddressObject>;
}

interface DeviceFieldResponse {
  query_values?: DeviceObject;
  ip?: FieldResponse<{ ip: string }> & {
    trust_signals?: IPTrustSignals;
  };
  true_ip?: FieldResponse<{ true_ip: string }> & {
    trust_signals?: IPTrustSignals;
  };
}

// ============= Feedback API Types =============

export interface FeedbackObject {
  id: string;
  type: 'action_id' | 'response_id';
  feedback_code: 1001 | 1002;
  reason_codes?: number[];
  reason_text?: string;
  feedback_timestamp?: string;
}

export interface FeedbackRequest {
  key: string;
  action: {
    type: 'feedback';
    organization?: string;
  };
  feedbacks: FeedbackObject[];
}

export interface FeedbackResponseItem {
  received: boolean;
  feedback_id: string;
  query_values: FeedbackObject;
}

export interface FeedbackResponse {
  warnings?: WarningObject[] | null;
  error?: ErrorObject | null;
  feedbacks: FeedbackResponseItem[];
}

// ============= Reason Codes =============

export const REASON_CODES = {
  CHARGEBACK: 3000,
  PROMOTION_ABUSE: 3001,
  PAYMENT_FRAUD: 3002,
  TRIANGULATION_FRAUD: 3003,
  ACCOUNT_TAKEOVER: 3004,
  FRAUDULENT_IDENTITY: 4000,
  EMAIL_NOT_LEGITIMATE: 4001,
  PROXY_IP_ADDRESS: 4002,
  VOIP_PHONE: 4003,
  BILLING_SHIPPING_MISMATCH: 4004,
} as const;

export const FEEDBACK_CODES = {
  APPROVED_AND_VALIDATED: 1001,
  DECLINED: 1002,
} as const;

// ============= Error Codes =============

export const ERROR_CODES = {
  MONTHLY_SPEND_LIMIT: 1000,
  THROTTLE_REACHED: 1001,
  DAILY_QUOTA_REACHED: 1003,
  WEEKLY_QUOTA_REACHED: 1004,
  MONTHLY_QUOTA_REACHED: 1005,
  PACKAGE_USAGE_EXCEEDED: 1006,
  PACKAGE_EXPIRED: 1007,
  API_SUSPENDED: 1008,
  SSL_REQUIRED: 1009,
  KEY_IN_QUERY_PARAMS: 1011,
  NO_API_KEY: 1012,
  INVALID_API_KEY: 1014,
  FIELD_VALIDATION_ERROR: 1015,
  API_KEY_WRONG_TYPE: 1016,
  PARTIAL_ADDRESS: 1017,
  TOO_MANY_FEEDBACKS: 1023,
  RAW_WITH_OTHER_FIELDS: 1024,
  MISSING_REQUIRED_FIELD: 2023,
  ACTION_REQUIRED: 2030,
  INVALID_ACTION: 2031,
  VERSION_NOT_ALLOWED: 2033,
  ACCESS_DENIED: 2035,
} as const;
