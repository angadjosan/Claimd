// Utility function to mask SSN for privacy
export function maskSSN(ssn: string): string {
  if (!ssn) return '';
  
  // Remove any non-digit characters
  const digits = ssn.replace(/\D/g, '');
  
  // If SSN is not 9 digits, return as is
  if (digits.length !== 9) return ssn;
  
  // Mask first 5 digits, show last 4
  return `***-**-${digits.slice(-4)}`;
}
