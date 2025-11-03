// Test script for brand assets color dynamicity
console.log('Testing brand color dynamicity...');

// Function to test if CSS variables are properly applied
function testCSSVariables() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  // Get the CSS variables
  const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
  const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim();
  const fontFamily = computedStyle.getPropertyValue('--font-family').trim();
  
  console.log('Current CSS Variables:');
  console.log('--primary-color:', primaryColor);
  console.log('--secondary-color:', secondaryColor);
  console.log('--font-family:', fontFamily);
  
  // Check if variables are applied to elements
  const navItems = document.querySelectorAll('.nav-item.active');
  if (navItems.length > 0) {
    const navItemStyle = getComputedStyle(navItems[0]);
    console.log('Active nav item background color:', navItemStyle.backgroundColor);
    console.log('Does it match primary color?', isColorSimilar(navItemStyle.backgroundColor, primaryColor));
  } else {
    console.log('No active nav items found to test');
  }
  
  const buttons = document.querySelectorAll('.btn-primary');
  if (buttons.length > 0) {
    const buttonStyle = getComputedStyle(buttons[0]);
    console.log('Primary button background color:', buttonStyle.backgroundColor);
    console.log('Does it match primary color?', isColorSimilar(buttonStyle.backgroundColor, primaryColor));
  } else {
    console.log('No primary buttons found to test');
  }
}

// Helper function to compare colors (accounting for RGB vs HEX format differences)
function isColorSimilar(color1, color2) {
  // Simple implementation - in a real test, you'd want more robust color comparison
  return color1.includes(color2) || color2.includes(color1);
}

// Run tests when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, running tests...');
  testCSSVariables();
  
  // Test color changes
  console.log('Testing color change simulation...');
  
  // Simulate changing the primary color
  document.documentElement.style.setProperty('--primary-color', '#ff5500');
  
  // Wait a moment for changes to apply
  setTimeout(() => {
    console.log('After color change:');
    testCSSVariables();
    console.log('Brand color dynamicity test complete!');
  }, 1000);
});

// Instructions for manual testing:
// 1. Open browser console
// 2. Navigate to Brand Assets page
// 3. Change colors and save
// 4. Verify that components across the app reflect the new colors
console.log('To test manually, change colors in Brand Assets page and verify changes across components');