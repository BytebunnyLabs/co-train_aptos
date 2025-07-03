/**
 * Utility functions for formatting numbers, currencies, and other data
 */

/**
 * Format APT token amounts with proper decimals and units
 */
export function formatAPT(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0 APT';
  
  // Convert from octas to APT if the number is very large (likely in octas)
  const aptAmount = num > 1000000 ? num / 100000000 : num;
  
  if (aptAmount >= 1000000) {
    return `${(aptAmount / 1000000).toFixed(2)}M APT`;
  } else if (aptAmount >= 1000) {
    return `${(aptAmount / 1000).toFixed(2)}K APT`;
  } else if (aptAmount >= 1) {
    return `${aptAmount.toFixed(2)} APT`;
  } else {
    return `${aptAmount.toFixed(4)} APT`;
  }
}

/**
 * Format large numbers with appropriate units (K, M, B)
 */
export function formatNumber(num: number | string): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  } else {
    return number.toLocaleString();
  }
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}

/**
 * Format wallet address for display (shortened with ellipsis)
 */
export function formatAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format compute power units
 */
export function formatComputePower(units: number): string {
  if (units >= 1000000000) {
    return `${(units / 1000000000).toFixed(1)}GH/s`;
  } else if (units >= 1000000) {
    return `${(units / 1000000).toFixed(1)}MH/s`;
  } else if (units >= 1000) {
    return `${(units / 1000).toFixed(1)}KH/s`;
  } else {
    return `${units}H/s`;
  }
}

/**
 * Format network latency
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Format reputation score with color indication
 */
export function formatReputation(score: number): {
  text: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  if (score >= 80) {
    return { text: `${score}/100`, color: 'green' };
  } else if (score >= 60) {
    return { text: `${score}/100`, color: 'yellow' };
  } else if (score >= 0) {
    return { text: `${score}/100`, color: 'red' };
  } else {
    return { text: 'N/A', color: 'gray' };
  }
}