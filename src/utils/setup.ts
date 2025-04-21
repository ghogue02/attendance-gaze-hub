
/**
 * This file ensures type dependencies are properly loaded
 * It's a workaround for the tsconfig read-only limitation
 */
export const setupEnvironment = () => {
  // This is just a placeholder function that ensures the file is included in the build
  return true;
};

// Initialize environment-specific settings
if (typeof window !== 'undefined') {
  // Browser-specific initialization
  console.log('Environment setup complete');
}
