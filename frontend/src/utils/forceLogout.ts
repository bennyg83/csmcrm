// Force logout utility to clear all authentication state
export const forceLogout = () => {
  console.log('Force logout - clearing all authentication state');
  
  // Clear all localStorage
  localStorage.clear();
  console.log('Force logout - localStorage cleared');
  
  // Clear all sessionStorage
  sessionStorage.clear();
  console.log('Force logout - sessionStorage cleared');
  
  // Clear any cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  console.log('Force logout - cookies cleared');
  
  // Clear any cached data in memory
  if (window.location.href.includes('/settings')) {
    // If we're on settings page, force a complete page refresh
    window.location.href = '/login';
  } else {
    // Force redirect to login page with cache-busting
    const timestamp = new Date().getTime();
    window.location.href = `/login?t=${timestamp}`;
  }
  
  // Force page reload to clear any cached state
  setTimeout(() => {
    window.location.reload();
  }, 100);
}; 