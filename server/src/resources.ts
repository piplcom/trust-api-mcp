/**
 * MCP Resource Providers using mcp-framework
 * Provides reference documentation and examples through MCP resources
 */

import { MCPResource, ResourceContent } from "mcp-framework";
import { ERROR_CODES, REASON_CODES, FEEDBACK_CODES } from './types.js';

/**
 * Field Schemas Resource
 */
export class FieldSchemasResource extends MCPResource {
  uri = 'trust://schemas/fields';
  name = 'Field Schemas';
  description = 'Complete schema documentation for all Trust API data fields';
  mimeType = 'application/json';

  async read(): Promise<ResourceContent[]> {
    return [{
      uri: this.uri,
      mimeType: this.mimeType,
      text: JSON.stringify(this.getFieldSchemas(), null, 2),
    }];
  }

  private getFieldSchemas() {
    return {
      primary_fields: {
        name: {
          description: 'Person name information',
          required_fields: 'Either raw OR (first_name AND last_name)',
          fields: {
            raw: { type: 'string', description: 'Unparsed full name' },
            first_name: { type: 'string', description: 'First name' },
            last_name: { type: 'string', description: 'Last name' },
            middle_name: { type: 'string', description: 'Middle name or initial', optional: true },
            prefix: { type: 'string', description: 'Name prefix (Mr, Dr, etc)', optional: true },
            suffix: { type: 'string', description: 'Name suffix (Jr, III, etc)', optional: true },
          },
        },
        email: {
          description: 'Email address information',
          required_fields: 'address',
          fields: {
            address: { type: 'string', description: 'Email address', format: 'email' },
            verified: { type: 'boolean', description: 'Email verification status', optional: true },
          },
        },
        phone: {
          description: 'Phone number information',
          required_fields: 'Either raw OR (country_code AND number)',
          fields: {
            raw: { type: 'string', description: 'Unparsed phone number' },
            country_code: { type: 'string|number', description: 'International dialing code' },
            number: { type: 'string|number', description: 'Phone number without country code' },
            extension: { type: 'string|number', description: 'Phone extension', optional: true },
            verified: { type: 'boolean', description: 'Phone verification status', optional: true },
          },
        },
        address: {
          description: 'Physical address information',
          required_fields: 'At least one of: raw, country, state, zip_code, or city',
          fields: {
            raw: { type: 'string', description: 'Unparsed full address' },
            country: { type: 'string', description: '2-letter ISO country code' },
            state: { type: 'string', description: 'State/province code' },
            city: { type: 'string', description: 'City name' },
            street: { type: 'string', description: 'Street name' },
            house: { type: 'string', description: 'House/building number' },
            po_box: { type: 'string', description: 'PO box number' },
            zip_code: { type: 'string', description: 'Postal/ZIP code' },
          },
        },
        device: {
          description: 'Device and IP information',
          required_fields: 'None (all fields optional)',
          key_fields: {
            ip: { type: 'string', description: 'IP address (IPv4 or IPv6)' },
            true_ip: { type: 'string', description: 'Actual IP if behind proxy/VPN' },
            identifier: { type: 'string', description: 'Device fingerprint' },
          },
        },
      },
      additional_fields: {
        person: {
          description: 'Personal information',
          fields: {
            dob: { type: 'string', description: 'Date of birth (YYYY-MM-DD or age)' },
            gender: { type: 'string', description: 'Gender (M or F)' },
          },
        },
        personal_identifier: {
          description: 'Government-issued ID',
          required_fields: 'type AND value',
          fields: {
            type: { type: 'string', description: 'ID type (CPF, SSN, etc)' },
            value: { type: 'string', description: 'ID value' },
            country: { type: 'string', description: 'Country code' },
            issue_date: { type: 'string', description: 'Issue date (YYYY-MM-DD)' },
            expiry_date: { type: 'string', description: 'Expiry date (YYYY-MM-DD)' },
          },
        },
        account: {
          description: 'User account information',
          fields: {
            created: { type: 'string', description: 'Account creation timestamp' },
            id: { type: 'string', description: 'Account identifier' },
            ip_created: { type: 'string', description: 'IP used to create account' },
            ip_history: { type: 'array', description: 'Historical IP addresses' },
            ip_last: { type: 'string', description: 'Last used IP address' },
            active: { type: 'boolean', description: 'Account active status' },
          },
          note: 'Can also contain primary data objects (name, email, phone, etc)',
        },
        browser: {
          description: 'Browser information',
          fields: {
            user_agent: { type: 'string', description: 'User agent string' },
            accept_language: { type: 'string', description: 'Accepted languages' },
            is_incognito_mode: { type: 'boolean', description: 'Incognito/private mode' },
          },
        },
        card: {
          description: 'Payment card information',
          fields: {
            bin: { type: 'number', description: 'First 8 digits of card' },
            brand: { type: 'string', description: 'Card brand (Visa, Mastercard, etc)' },
            funding: { type: 'string', description: 'C=Credit, D=Debit, P=Prepaid' },
            country: { type: 'string', description: 'Card issuing country' },
          },
        },
        order: {
          description: 'Order information',
          fields: {
            amount: { type: 'number', description: 'Order amount' },
            currency: { type: 'string', description: 'Currency code (ISO 4217)' },
            created_at: { type: 'string', description: 'Order creation timestamp' },
            number_of_items: { type: 'number', description: 'Number of items' },
            shipping_method: { type: 'string', description: 'Shipping method' },
          },
        },
        payment: {
          description: 'Payment information',
          fields: {
            payment_method: { type: 'string', description: 'Payment method used' },
            is_recurring: { type: 'boolean', description: 'Recurring payment flag' },
          },
        },
      },
      groups: {
        description: 'Groups organize data objects into distinct identities',
        available_groups: ['account', 'billing', 'shipping'],
        usage: 'Place primary data objects inside groups to separate different identities',
        example: {
          account: { name: {}, email: {}, phone: {} },
          billing: { name: {}, address: {} },
          shipping: { name: {}, address: {} },
        },
      },
    };
  }
}

/**
 * Example Requests Resource
 */
export class ExampleRequestsResource extends MCPResource {
  uri = 'trust://examples/requests';
  name = 'Example Requests';
  description = 'Example Trust API requests for common scenarios';
  mimeType = 'application/json';

  async read(): Promise<ResourceContent[]> {
    return [{
      uri: this.uri,
      mimeType: this.mimeType,
      text: JSON.stringify(this.getExampleRequests(), null, 2),
    }];
  }

  private getExampleRequests() {
    return {
      basic_signup: {
        description: 'Basic signup request with account information',
        request: {
          action: {
            type: 'signup',
            id: 'SIGNUP-001',
          },
          account: {
            name: {
              first_name: 'John',
              last_name: 'Doe',
            },
            email: {
              address: 'john.doe@example.com',
              verified: false,
            },
            phone: {
              country_code: '1',
              number: '5551234567',
            },
          },
          device: {
            ip: '192.168.1.1',
          },
          echo_query: true,
          signals: true,
        },
      },
      ecommerce_purchase: {
        description: 'E-commerce purchase with billing and shipping',
        request: {
          action: {
            type: 'purchase',
            id: 'ORDER-12345',
          },
          account: {
            email: {
              address: 'customer@example.com',
              verified: true,
            },
            id: 'USER-789',
            created: '2023-01-15 10:30:00',
          },
          billing: {
            name: {
              first_name: 'Jane',
              last_name: 'Smith',
            },
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zip_code: '10001',
              country: 'US',
            },
            phone: {
              country_code: '1',
              number: '2125551234',
            },
          },
          shipping: {
            name: {
              first_name: 'Jane',
              last_name: 'Smith',
            },
            address: {
              street: '456 Oak Ave',
              city: 'Brooklyn',
              state: 'NY',
              zip_code: '11201',
              country: 'US',
            },
          },
          card: {
            bin: 41111111,
            brand: 'Visa',
            funding: 'C',
            country: 'US',
          },
          order: {
            amount: 299.99,
            currency: 'USD',
            number_of_items: 3,
            shipping_method: 'standard',
          },
          device: {
            ip: '98.765.43.21',
            identifier: 'device-fingerprint-123',
          },
          connectivity: true,
        },
      },
      high_risk_indicators: {
        description: 'Request with high-risk indicators',
        request: {
          action: {
            type: 'purchase',
            id: 'RISKY-001',
          },
          account: {
            email: {
              address: 'temp123@disposable-email.com',
            },
            created: '2024-01-01 00:00:00',
          },
          billing: {
            address: {
              raw: 'Some fake address',
            },
          },
          device: {
            ip: '192.168.1.1',
            is_emulator: true,
            is_rooted: true,
            is_vpn: true,
          },
        },
        expected_issues: [
          'Disposable email domain',
          'New account (created recently)',
          'Invalid/suspicious address',
          'VPN/Proxy usage',
          'Emulator detected',
          'Rooted device',
        ],
      },
      with_personal_identifier: {
        description: 'Request with CPF (Brazilian ID)',
        request: {
          action: {
            type: 'signup',
          },
          account: {
            name: {
              first_name: 'João',
              last_name: 'Silva',
            },
            personal_identifier: {
              type: 'CPF',
              value: '123.456.789-09',
              country: 'BR',
            },
          },
          billing: {
            address: {
              city: 'São Paulo',
              state: 'SP',
              country: 'BR',
              zip_code: '01310-100',
            },
          },
        },
      },
    };
  }
}

/**
 * Error Codes Resource
 */
export class ErrorCodesResource extends MCPResource {
  uri = 'trust://reference/errors';
  name = 'Error Code Reference';
  description = 'Complete list of Trust API error codes and their meanings';
  mimeType = 'application/json';

  async read(): Promise<ResourceContent[]> {
    return [{
      uri: this.uri,
      mimeType: this.mimeType,
      text: JSON.stringify(this.getErrorReference(), null, 2),
    }];
  }

  private getErrorReference() {
    return {
      rate_limiting: {
        1001: { message: 'Throttle reached', http_status: 429, resolution: 'Implement retry with backoff' },
        1003: { message: 'Daily quota reached', http_status: 429, resolution: 'Contact admin to increase quota' },
        1004: { message: 'Weekly quota reached', http_status: 429, resolution: 'Contact admin to increase quota' },
        1005: { message: 'Monthly quota reached', http_status: 429, resolution: 'Contact admin to increase quota' },
      },
      authentication: {
        1012: { message: 'No API key provided', http_status: 401, resolution: 'Include API key in request body' },
        1014: { message: 'Invalid API key', http_status: 401, resolution: 'Check API key validity' },
        1016: { message: 'Wrong API key type', http_status: 401, resolution: 'Use Trust API key, not Search API key' },
      },
      validation: {
        1015: { message: 'Field validation error', http_status: 400, resolution: 'Check field requirements' },
        1017: { message: 'Partial address', http_status: 400, resolution: 'Provide complete address or add other fields' },
        1024: { message: 'Raw field with other fields', http_status: 400, resolution: 'Use either raw OR parsed fields' },
        2023: { message: 'Missing required field', http_status: 400, resolution: 'Add required fields' },
        2030: { message: 'Action required', http_status: 400, resolution: 'Include action object' },
        2031: { message: 'Invalid action type', http_status: 400, resolution: 'Use valid action type' },
      },
      account: {
        1000: { message: 'Monthly spend limit reached', http_status: 403, resolution: 'Contact account manager' },
        1006: { message: 'Package usage exceeded', http_status: 429, resolution: 'Purchase additional queries' },
        1007: { message: 'Package expired', http_status: 429, resolution: 'Renew package' },
        1008: { message: 'API suspended', http_status: 402, resolution: 'Contact support' },
        2035: { message: 'Access denied', http_status: 403, resolution: 'Contact account administrator' },
      },
      server: {
        500: { message: 'Internal server error', http_status: 500, resolution: 'Retry with exponential backoff' },
      },
      all_codes: ERROR_CODES,
    };
  }
}

/**
 * Trust Signals Resource
 */
export class TrustSignalsResource extends MCPResource {
  uri = 'trust://reference/signals';
  name = 'Trust Signal Definitions';
  description = 'Definitions and explanations of all trust signals';
  mimeType = 'application/json';

  async read(): Promise<ResourceContent[]> {
    return [{
      uri: this.uri,
      mimeType: this.mimeType,
      text: JSON.stringify(this.getTrustSignalDefinitions(), null, 2),
    }];
  }

  private getTrustSignalDefinitions() {
    return {
      email_signals: {
        is_valid: {
          description: 'Email address format validation',
          values: { true: 'Valid format', false: 'Invalid format' },
          impact: 'Invalid emails cannot be scored',
        },
        domain_type: {
          description: 'Type of email domain',
          values: {
            personal: 'Personal email provider (gmail, yahoo, etc)',
            commercial: 'Business email domain',
            disposable: 'Temporary/disposable email service',
          },
          impact: 'Disposable emails indicate higher risk',
        },
        domain_is_deliverable: {
          description: 'Whether domain can receive emails',
          impact: 'Non-deliverable domains suggest fake emails',
        },
        age_months: {
          description: 'How long email has been in Elephant database',
          impact: 'Older emails generally more trustworthy',
        },
        velocity: {
          description: 'Usage frequency in past 365 days',
          impact: 'High velocity may indicate abuse',
        },
        volatility: {
          description: 'Number of unique identities associated',
          impact: 'High volatility suggests suspicious activity',
        },
        number_of_social_accounts: {
          description: 'Linked social media accounts',
          impact: 'More accounts indicate stronger digital footprint',
        },
      },
      phone_signals: {
        is_valid: {
          description: 'Phone number format validation',
          impact: 'Invalid phones cannot be scored',
        },
        line_type: {
          description: 'Type of phone line',
          values: {
            mobile: 'Mobile phone',
            landline: 'Fixed landline',
            voip: 'Voice over IP',
            'toll-free': 'Toll-free number',
          },
          impact: 'VOIP phones often associated with higher risk',
        },
        voip_type: {
          description: 'VOIP service type',
          values: {
            fixed: 'Fixed VOIP (e.g., business phone)',
            non_fixed: 'Non-fixed VOIP (e.g., Google Voice)',
          },
          impact: 'Non-fixed VOIP higher risk than fixed',
        },
        is_commercial: {
          description: 'Business vs personal phone',
          impact: 'Commercial numbers may need different validation',
        },
        is_disposable: {
          description: 'Temporary phone service detection',
          impact: 'Disposable phones indicate very high risk',
        },
        carrier: {
          description: 'Phone carrier/provider name',
          impact: 'Some carriers associated with higher fraud rates',
        },
      },
      ip_signals: {
        is_valid: {
          description: 'IP address format validation',
          impact: 'Invalid IPs cannot be scored',
        },
        is_proxy: {
          description: 'Proxy server detection',
          impact: 'Proxies often used to hide location',
        },
        is_vpn: {
          description: 'VPN connection detection',
          impact: 'VPNs mask true location and identity',
        },
        is_tor: {
          description: 'TOR network detection',
          impact: 'TOR indicates very high anonymization attempt',
        },
        is_bot: {
          description: 'Bot/automated traffic detection',
          impact: 'Bot traffic usually fraudulent',
        },
        connection_type: {
          description: 'Type of internet connection',
          values: {
            residential: 'Home internet connection',
            corporate: 'Business network',
            'data center': 'Cloud/hosting provider',
            education: 'School/university network',
            mobile: 'Mobile carrier network',
          },
          impact: 'Data center IPs often indicate automation',
        },
        country_code: {
          description: 'IP geolocation country',
          impact: 'Mismatch with address indicates risk',
        },
      },
      address_signals: {
        is_valid: {
          description: 'Address validation against postal records',
          impact: 'Invalid addresses cannot be delivered to',
        },
        validity_level: {
          description: 'Granularity of address validation',
          values: {
            valid_to_house: 'Validated to house number',
            valid_to_street: 'Validated to street',
            valid_to_city: 'Validated to city',
            valid_to_zip_code: 'Validated to ZIP',
            invalid: 'Address not valid',
          },
          impact: 'More specific validation indicates real address',
        },
        is_suspicious: {
          description: 'Known fraud patterns detected',
          impact: 'Suspicious addresses need review',
        },
        is_freight_forward: {
          description: 'Freight forwarding service address',
          impact: 'Common in reshipping fraud schemes',
        },
        is_commercial: {
          description: 'Business vs residential address',
          impact: 'Commercial addresses may need verification',
        },
        is_pobox: {
          description: 'PO Box address detection',
          impact: 'PO Boxes prevent physical verification',
        },
      },
      connectivity_scores: {
        description: 'Measures relationship between identity elements',
        scale: '1-100 (1=no connection, 100=strong connection)',
        match_field: 'Boolean indicator of sufficient connectivity',
        interpretation: {
          '80-100': 'Strong connection - same person or close relation',
          '60-79': 'Moderate connection - possible relationship',
          '40-59': 'Weak connection - limited evidence',
          '1-39': 'Very weak or no connection',
          null: 'Insufficient data to determine',
        },
      },
      attribute_scores: {
        description: 'Individual trust scores for data elements',
        scale: '0-1000 (0=no trust, 1000=full trust)',
        available_for: ['email', 'phone', 'address', 'ip'],
        interpretation: {
          '800-1000': 'Very trustworthy',
          '600-799': 'Moderately trustworthy',
          '400-599': 'Neutral/unknown',
          '200-399': 'Somewhat risky',
          '0-199': 'High risk',
        },
      },
    };
  }
}

/**
 * Reason Codes Resource
 */
export class ReasonCodesResource extends MCPResource {
  uri = 'trust://reference/reason-codes';
  name = 'Reason Codes';
  description = 'Feedback reason codes for transaction outcomes';
  mimeType = 'application/json';

  async read(): Promise<ResourceContent[]> {
    return [{
      uri: this.uri,
      mimeType: this.mimeType,
      text: JSON.stringify(this.getReasonCodes(), null, 2),
    }];
  }

  private getReasonCodes() {
    return {
      feedback_codes: {
        1001: {
          name: 'APPROVED_AND_VALIDATED',
          description: 'Transaction was approved and validated as legitimate',
          usage: 'Use when transaction completed successfully without issues',
        },
        1002: {
          name: 'DECLINED',
          description: 'Transaction was declined or found to be fraudulent',
          usage: 'Use when transaction was rejected or later found fraudulent',
        },
      },
      reason_codes: {
        fraud_types: {
          3000: { name: 'CHARGEBACK', description: 'Customer disputed the charge' },
          3001: { name: 'PROMOTION_ABUSE', description: 'Abuse of promotional offers' },
          3002: { name: 'PAYMENT_FRAUD', description: 'Fraudulent payment method used' },
          3003: { name: 'TRIANGULATION_FRAUD', description: 'Triangulation fraud scheme' },
          3004: { name: 'ACCOUNT_TAKEOVER', description: 'Compromised account used' },
        },
        identity_issues: {
          4000: { name: 'FRAUDULENT_IDENTITY', description: 'Synthetic or fake identity' },
          4001: { name: 'EMAIL_NOT_LEGITIMATE', description: 'Fake or invalid email' },
          4002: { name: 'PROXY_IP_ADDRESS', description: 'Proxy/VPN used to hide location' },
          4003: { name: 'VOIP_PHONE', description: 'VOIP phone number used' },
          4004: { name: 'BILLING_SHIPPING_MISMATCH', description: 'Addresses not related' },
        },
      },
      usage_example: {
        description: 'Example feedback for declined transaction',
        feedback: {
          id: 'response-id-123',
          type: 'response_id',
          feedback_code: 1002,
          reason_codes: [3000, 4002],
          reason_text: 'Chargeback received, proxy IP was used',
          feedback_timestamp: '1701156987',
        },
      },
      constants: {
        REASON_CODES,
        FEEDBACK_CODES,
      },
    };
  }
}
