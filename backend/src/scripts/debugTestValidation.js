const puppeteer = require('puppeteer');

async function debugExampleDotCom() {
  console.log('🔍 Debugging example.com content...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📡 Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    
    console.log('✅ Page loaded successfully!\n');
    
    // Get all the text content
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Full page text:');
    console.log('='.repeat(50));
    console.log(pageText);
    console.log('='.repeat(50));
    console.log('');
    
    // Check specifically for "Example Domain"
    const hasExampleDomain = pageText.toLowerCase().includes('example domain');
    console.log(`🔍 Contains "Example Domain": ${hasExampleDomain ? '✅ YES' : '❌ NO'}`);
    
    // Check with textContent too
    const textContent = await page.evaluate(() => document.body.textContent);
    const hasExampleDomainTC = textContent.toLowerCase().includes('example domain');
    console.log(`🔍 Contains "Example Domain" (textContent): ${hasExampleDomainTC ? '✅ YES' : '❌ NO'}`);
    
    // Get the page HTML to see structure
    const html = await page.content();
    console.log('\n📝 Page HTML (first 500 chars):');
    console.log(html.substring(0, 500) + '...');
    
    // Get current URL
    const currentUrl = page.url();
    console.log(`\n🌐 Current URL: ${currentUrl}`);
    
    // Wait 5 seconds so you can see the browser
    console.log('\n⏳ Waiting 5 seconds (you can see the browser)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔚 Browser closed');
  }
}

debugExampleDotCom(); 