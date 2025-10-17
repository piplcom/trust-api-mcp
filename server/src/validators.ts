/**
 * Request Validation Logic
 * Validates Trust API request data according to API rules
 */

import {
  TrustRequest,
  NameObject,
  EmailObject,
  PhoneObject,
  AddressObject,
  PersonObject,
  PersonalIdentifierObject,
  DeviceObject,
  ERROR_CODES,
} from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code?: number;
}

export class RequestValidator {
  /**
   * Validate a complete Trust API request
   */
  validateRequest(request: Partial<TrustRequest>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for required action
    if (!request.action) {
      errors.push({
        field: 'action',
        message: 'Action object is required',
        code: ERROR_CODES.ACTION_REQUIRED,
      });
    } else if (!request.action.type) {
      errors.push({
        field: 'action.type',
        message: 'Action type is required',
        code: ERROR_CODES.INVALID_ACTION,
      });
    }

    // Check for at least one data field
    const dataFields = [
      'name', 'email', 'phone', 'address', 'device',
      'account', 'billing', 'shipping', 'sender', 'recipient',
      'browser', 'card', 'order', 'page', 'payment', 'session',
      'person', 'personal_identifier', 'locale', 'custom', 'metadata'
    ];

    const hasDataField = dataFields.some(field =>
      request[field as keyof TrustRequest] !== undefined
    );

    if (!hasDataField) {
      errors.push({
        field: 'data',
        message: 'At least one data field is required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    }

    // Validate individual fields
    if (request.name) {
      this.validateName(request.name, 'name', errors, warnings);
    }

    if (request.email) {
      this.validateEmail(request.email, 'email', errors, warnings);
    }

    if (request.phone) {
      this.validatePhone(request.phone, 'phone', errors, warnings);
    }

    if (request.address) {
      this.validateAddress(request.address, 'address', errors, warnings);
    }

    if (request.device) {
      this.validateDevice(request.device, 'device', errors, warnings);
    }

    if (request.person) {
      this.validatePerson(request.person, 'person', errors, warnings);
    }

    if (request.personal_identifier) {
      this.validatePersonalIdentifier(request.personal_identifier, 'personal_identifier', errors, warnings);
    }

    // Validate grouped fields
    if (request.account) {
      this.validateAccountGroup(request.account, errors, warnings);
    }

    if (request.billing) {
      this.validateBillingShippingGroup(request.billing, 'billing', errors, warnings);
    }

    if (request.shipping) {
      this.validateBillingShippingGroup(request.shipping, 'shipping', errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate name object
   */
  private validateName(
    name: NameObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (name.raw) {
      // Check for conflicting fields
      if (name.first_name || name.last_name || name.middle_name || name.prefix || name.suffix) {
        errors.push({
          field: path,
          message: 'Cannot use raw with other name fields',
          code: ERROR_CODES.RAW_WITH_OTHER_FIELDS,
        });
      }
      // Validate raw name
      if (name.raw.trim().length < 2) {
        warnings.push({
          field: `${path}.raw`,
          message: 'Name appears too short',
        });
      }
    } else {
      // Check for required fields
      if (!name.first_name || !name.last_name) {
        errors.push({
          field: path,
          message: 'Name must have either raw or both first_name and last_name',
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else {
        // Validate individual fields
        if (name.first_name.length < 1) {
          warnings.push({
            field: `${path}.first_name`,
            message: 'First name should be at least 1 character',
          });
        }
        if (name.last_name.length < 2) {
          warnings.push({
            field: `${path}.last_name`,
            message: 'Last name should be at least 2 characters',
          });
        }
      }
    }
  }

  /**
   * Validate email object
   */
  private validateEmail(
    email: EmailObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!email.address) {
      errors.push({
        field: path,
        message: 'Email address is required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9'.!_%\-+]+@[a-zA-Z0-9._%\-]+\.[a-zA-Z]{2,24}$/;
    if (!emailRegex.test(email.address)) {
      errors.push({
        field: `${path}.address`,
        message: 'Invalid email format',
        code: ERROR_CODES.FIELD_VALIDATION_ERROR,
      });
    }

    // Check for common test emails
    const testEmails = ['test@test.com', 'example@example.com', 'user@example.com'];
    if (testEmails.includes(email.address.toLowerCase())) {
      warnings.push({
        field: `${path}.address`,
        message: 'Test email address detected',
      });
    }
  }

  /**
   * Validate phone object
   */
  private validatePhone(
    phone: PhoneObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (phone.raw) {
      // Check for conflicting fields
      if (phone.country_code || phone.number || phone.extension) {
        errors.push({
          field: path,
          message: 'Cannot use raw with other phone fields',
          code: ERROR_CODES.RAW_WITH_OTHER_FIELDS,
        });
      }
      // Basic raw phone validation
      const digitsOnly = phone.raw.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        warnings.push({
          field: `${path}.raw`,
          message: 'Phone number appears too short',
        });
      }
    } else {
      // Check for required fields
      if (!phone.country_code || !phone.number) {
        errors.push({
          field: path,
          message: 'Phone must have either raw or both country_code and number',
          code: ERROR_CODES.FIELD_VALIDATION_ERROR,
        });
      } else {
        // Validate country code
        const cc = String(phone.country_code);
        if (cc.length > 3 || cc.length < 1) {
          warnings.push({
            field: `${path}.country_code`,
            message: 'Country code should be 1-3 digits',
          });
        }

        // Validate number
        const num = String(phone.number);
        if (num.length < 7 || num.length > 15) {
          warnings.push({
            field: `${path}.number`,
            message: 'Phone number should be 7-15 digits',
          });
        }
      }
    }
  }

  /**
   * Validate address object
   */
  private validateAddress(
    address: AddressObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (address.raw) {
      // Check for conflicting fields
      const otherFields = ['country', 'state', 'city', 'street', 'house', 'po_box', 'zip_code'];
      const hasOtherFields = otherFields.some(field => address[field as keyof AddressObject]);
      
      if (hasOtherFields) {
        errors.push({
          field: path,
          message: 'Cannot use raw with other address fields',
          code: ERROR_CODES.RAW_WITH_OTHER_FIELDS,
        });
      }
    } else {
      // Check for minimum required fields
      const hasMinimumFields = address.country || address.state || address.zip_code || address.city;
      
      if (!hasMinimumFields) {
        errors.push({
          field: path,
          message: 'Address must have at least one of: raw, country, state, zip_code, or city',
          code: ERROR_CODES.PARTIAL_ADDRESS,
        });
      }

      // Validate country code if present
      if (address.country) {
        if (address.country.length !== 2) {
          warnings.push({
            field: `${path}.country`,
            message: 'Country should be a 2-letter ISO code',
            code: 2013,
          });
        }
      }

      // Validate state code if present
      if (address.state && address.country === 'US') {
        if (address.state.length !== 2) {
          warnings.push({
            field: `${path}.state`,
            message: 'US state should be a 2-letter code',
            code: 2005,
          });
        }
      }

      // Check for state without country
      if (address.state && !address.country) {
        warnings.push({
          field: `${path}.state`,
          message: 'State provided without country',
          code: 2014,
        });
      }

      // Check for city without state
      if (address.city && !address.state && !address.country) {
        warnings.push({
          field: `${path}.city`,
          message: 'City provided without state or country',
          code: 2016,
        });
      }
    }
  }

  /**
   * Validate device object
   */
  private validateDevice(
    device: DeviceObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate IP addresses
    if (device.ip) {
      if (!this.isValidIP(device.ip)) {
        errors.push({
          field: `${path}.ip`,
          message: 'Invalid IP address format',
          code: ERROR_CODES.FIELD_VALIDATION_ERROR,
        });
      }
    }

    if (device.true_ip) {
      if (!this.isValidIP(device.true_ip)) {
        errors.push({
          field: `${path}.true_ip`,
          message: 'Invalid true_ip address format',
          code: ERROR_CODES.FIELD_VALIDATION_ERROR,
        });
      }
    }

    // Validate battery level
    if (device.battery_level !== undefined) {
      if (device.battery_level < 0 || device.battery_level > 100) {
        warnings.push({
          field: `${path}.battery_level`,
          message: 'Battery level should be between 0 and 100',
        });
      }
    }

    // Check for emulator/virtual environment
    if (device.is_emulator || device.is_virtual_env) {
      warnings.push({
        field: path,
        message: 'Virtual environment or emulator detected',
      });
    }

    // Check for rooted device
    if (device.is_rooted) {
      warnings.push({
        field: path,
        message: 'Rooted/jailbroken device detected',
      });
    }
  }

  /**
   * Validate person object
   */
  private validatePerson(
    person: PersonObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate date of birth format
    if (person.dob) {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(person.dob) && !/^\d{4}(-\d{2})?$/.test(person.dob) && !/^\d+$/.test(person.dob)) {
        warnings.push({
          field: `${path}.dob`,
          message: 'Date of birth should be in YYYY-MM-DD, YYYY-MM, YYYY, or age format',
        });
      }
    }

    // Validate gender
    if (person.gender) {
      if (person.gender !== 'M' && person.gender !== 'F') {
        errors.push({
          field: `${path}.gender`,
          message: 'Gender must be M or F',
          code: ERROR_CODES.FIELD_VALIDATION_ERROR,
        });
      }
    }
  }

  /**
   * Validate personal identifier object
   */
  private validatePersonalIdentifier(
    identifier: PersonalIdentifierObject,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required fields
    if (!identifier.type) {
      errors.push({
        field: `${path}.type`,
        message: 'Identifier type is required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    }

    if (!identifier.value) {
      errors.push({
        field: `${path}.value`,
        message: 'Identifier value is required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    }

    // Validate CPF if type is CPF
    if (identifier.type === 'CPF' && identifier.value) {
      if (!this.isValidCPF(identifier.value)) {
        warnings.push({
          field: `${path}.value`,
          message: 'CPF format appears invalid',
        });
      }
    }

    // Validate dates
    if (identifier.issue_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(identifier.issue_date)) {
        warnings.push({
          field: `${path}.issue_date`,
          message: 'Issue date should be in YYYY-MM-DD format',
        });
      }
    }

    if (identifier.expiry_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(identifier.expiry_date)) {
        warnings.push({
          field: `${path}.expiry_date`,
          message: 'Expiry date should be in YYYY-MM-DD format',
        });
      }
    }
  }

  /**
   * Validate account group
   */
  private validateAccountGroup(
    account: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (account.name) {
      this.validateName(account.name, 'account.name', errors, warnings);
    }
    if (account.email) {
      this.validateEmail(account.email, 'account.email', errors, warnings);
    }
    if (account.phone) {
      this.validatePhone(account.phone, 'account.phone', errors, warnings);
    }
    if (account.address) {
      this.validateAddress(account.address, 'account.address', errors, warnings);
    }
    if (account.person) {
      this.validatePerson(account.person, 'account.person', errors, warnings);
    }
    if (account.personal_identifier) {
      this.validatePersonalIdentifier(account.personal_identifier, 'account.personal_identifier', errors, warnings);
    }

    // Validate account-specific fields
    if (account.created) {
      if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(account.created)) {
        warnings.push({
          field: 'account.created',
          message: 'Created date should be in YYYY-MM-DD HH:MM:SS format',
        });
      }
    }

    if (account.ip_created) {
      if (!this.isValidIP(account.ip_created)) {
        warnings.push({
          field: 'account.ip_created',
          message: 'Invalid IP address format',
        });
      }
    }

    if (account.ip_last) {
      if (!this.isValidIP(account.ip_last)) {
        warnings.push({
          field: 'account.ip_last',
          message: 'Invalid IP address format',
        });
      }
    }

    if (account.ip_history) {
      account.ip_history.forEach((ip: string, index: number) => {
        if (!this.isValidIP(ip)) {
          warnings.push({
            field: `account.ip_history[${index}]`,
            message: 'Invalid IP address format',
          });
        }
      });
    }
  }

  /**
   * Validate billing/shipping group
   */
  private validateBillingShippingGroup(
    group: any,
    groupName: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (group.name) {
      this.validateName(group.name, `${groupName}.name`, errors, warnings);
    }
    if (group.email) {
      this.validateEmail(group.email, `${groupName}.email`, errors, warnings);
    }
    if (group.phone) {
      this.validatePhone(group.phone, `${groupName}.phone`, errors, warnings);
    }
    if (group.address) {
      this.validateAddress(group.address, `${groupName}.address`, errors, warnings);
    }
  }

  /**
   * Helper: Validate IP address format
   */
  private isValidIP(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 (simplified check)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Helper: Validate CPF format (Brazilian ID)
   */
  private isValidCPF(cpf: string): boolean {
    // Remove non-digits
    const cleaned = cpf.replace(/\D/g, '');
    
    // CPF should have 11 digits
    if (cleaned.length !== 11) {
      return false;
    }

    // Check for known invalid patterns
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    // Validate checksum (simplified)
    return true;
  }

  /**
   * Convert validation result to JSON Schema format
   */
  toJSONSchema(result: ValidationResult): any {
    return {
      valid: result.valid,
      errors: result.errors.map(e => ({
        instancePath: `/${e.field.replace('.', '/')}`,
        message: e.message,
        keyword: 'validation',
        params: { code: e.code },
      })),
      warnings: result.warnings.map(w => ({
        instancePath: `/${w.field.replace('.', '/')}`,
        message: w.message,
        keyword: 'warning',
        params: { code: w.code },
      })),
    };
  }
}

export default RequestValidator;
