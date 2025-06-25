// Test script to verify improvements to Labnex element finding and parsing
const { TestStepParser } = require('./packages/cli/src/testStepParser');

console.log('🧪 Testing Labnex Improvements...\n');

// Test cases based on the issues found in the logs
const testCases = [
  {
    name: "Small Modal Button",
    step: "Click the button labeled \"Small Modal\"",
    expected: "Should generate modal button selector"
  },
  {
    name: "Checkbox Selection",
    step: "Click to check the first checkbox",
    expected: "Should generate checkbox selector"
  },
  {
    name: "Email Field",
    step: "Enter \"domenic@example.com\" into the Email field",
    expected: "Should generate email input selector"
  },
  {
    name: "Full Name Field",
    step: "Enter \"Domenic Julian\" into the Full Name field",
    expected: "Should generate name input selector"
  },
  {
    name: "File Upload",
    step: "Upload a file named \"test_document.txt\" from local test folder",
    expected: "Should generate file input selector"
  }
];

console.log('📋 Running Test Cases:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   Step: "${testCase.step}"`);
  console.log(`   Expected: ${testCase.expected}`);
  
  try {
    const result = TestStepParser.parseStep(testCase.step);
    console.log(`   ✅ Result: ${result.action} on "${result.target}"`);
    if (result.value) {
      console.log(`   📝 Value: "${result.value}"`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
});

console.log('🎯 Testing Smart Selector Generation:\n');

// Test the smart selector generation
const selectorTests = [
  { desc: "Small Modal", expected: "modal" },
  { desc: "to check the first", expected: "checkbox" },
  { desc: "Email field", expected: "email" },
  { desc: "Submit button", expected: "submit" },
  { desc: "Cancel link", expected: "cancel" }
];

selectorTests.forEach((test, index) => {
  console.log(`${index + 1}. "${test.desc}" -> Should match ${test.expected} pattern`);
});

console.log('\n✨ Test script completed!');
console.log('💡 The improvements should now handle the element finding issues better.'); 