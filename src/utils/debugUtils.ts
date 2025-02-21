// Create a new utility file for debug functions

// Add type for debug data
type DebugData = Record<string, unknown>;

export const formatDebugLog = (data: DebugData): DebugData => {
  // Helper function to handle undefined values and truncate long arrays/objects
  const replacer = (value: unknown) => {
    if (value === undefined) {
      return 'undefined';
    }
    if (Array.isArray(value) && value.length > 3) {
      return `[${value.slice(0, 3).join(', ')}...]`;
    }
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects
      const formatted = Object.entries(value as Record<string, unknown>)
        .reduce<DebugData>((acc, [k, v]) => ({
          ...acc,
          [k]: v === undefined ? 'undefined' : v
        }), {});
      
      const keys = Object.keys(formatted);
      if (keys.length > 5) {
        const truncated = keys.slice(0, 5).reduce<DebugData>((acc, k) => {
          acc[k] = formatted[k];
          return acc;
        }, {});
        return { ...truncated, _truncated: `+${keys.length - 5} more` };
      }
      return formatted;
    }
    return value;
  };

  // Clean the object and preserve undefined values
  const cleanObject = Object.entries(data).reduce<DebugData>((acc, [key, value]) => ({
    ...acc,
    [key]: value === undefined ? 'undefined' : value
  }), {});

  // Use the custom replacer in stringify/parse
  return JSON.parse(JSON.stringify(cleanObject, replacer));
};

export const createDebugLogger = (namespace: string) => ({
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${namespace}] ${message}:`, data);
    }
  }
}); 