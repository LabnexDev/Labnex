const fs = require('fs');
const path = require('path');

// Fix duplicate function in elementFinder.ts
const elementFinderPath = path.join(__dirname, 'src/lib/elementFinder.ts');
if (fs.existsSync(elementFinderPath)) {
  let content = fs.readFileSync(elementFinderPath, 'utf8');
  
  // Remove duplicate captureFocusedDomSnippet function
  const firstIndex = content.indexOf('async function captureFocusedDomSnippet');
  const secondIndex = content.indexOf('export async function captureFocusedDomSnippet');
  
  if (firstIndex !== -1 && secondIndex !== -1 && firstIndex < secondIndex) {
    // Find the end of the first function
    let braceCount = 0;
    let inFunction = false;
    let endIndex = firstIndex;
    
    for (let i = firstIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    // Remove the first occurrence
    content = content.substring(0, firstIndex) + content.substring(endIndex);
    fs.writeFileSync(elementFinderPath, content);
    console.log('Fixed duplicate function in elementFinder.ts');
  }
}

// Add type guards to action handlers
const actionHandlersDir = path.join(__dirname, 'src/lib/actionHandlers');
const filesToFix = [
  'handleAssertion.ts',
  'handleClick.ts',
  'handleHover.ts',
  'handleScroll.ts',
  'handleSelect.ts',
  'handleType.ts',
  'handleUpload.ts'
];

filesToFix.forEach(file => {
  const filePath = path.join(actionHandlersDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add null checks after findElementWithFallbacks
    const regex = /const\s+(\w+)\s*=\s*await\s+findElementWithFallbacks\([^)]+\);/g;
    content = content.replace(regex, (match, varName) => {
      modified = true;
      return `${match}\n  if (!${varName}) {\n    throw new Error('Element not found');\n  }`;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Added null checks to ${file}`);
    }
  }
});

console.log('Type fixes completed. Run npm run build to check remaining issues.'); 