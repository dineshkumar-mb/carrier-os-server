export class LogSanitizer {
  private static SENSITIVE_KEYS = [
    'password',
    'access_token',
    'accesstoken',
    'refresh_token',
    'refreshtoken',
    'cookie',
    'authorization',
    'session',
    'api_key',
    'apikey',
    'secret'
  ];

  public static sanitize(input: any): any {
    if (!input) return input;
    if (typeof input === 'string') {
      let sanitized = input;
      for (const key of LogSanitizer.SENSITIVE_KEYS) {
        const regex = new RegExp(`("${key}"|'${key}'|${key})\\s*[:=]\\s*["']?([^"\\s&,]+)["']?`, 'gi');
        sanitized = sanitized.replace(regex, `$1="[REDACTED]"`);
      }
      return sanitized;
    }

    if (typeof input === 'object') {
      const sanitizedObj: Record<string, any> = Array.isArray(input) ? [] : {};
      for (const [key, value] of Object.entries(input)) {
        if (LogSanitizer.SENSITIVE_KEYS.includes(key.toLowerCase())) {
          sanitizedObj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizedObj[key] = LogSanitizer.sanitize(value);
        } else {
          sanitizedObj[key] = value;
        }
      }
      return sanitizedObj;
    }

    return input;
  }
}
