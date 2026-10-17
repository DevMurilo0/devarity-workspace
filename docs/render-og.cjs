// Ferramenta opcional de exportação; não é executada pela aplicação.
const {chromium}=require('playwright');
const sharp=require('sharp');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:2});
    await page.goto(pathToFileURL(path.join(__dirname,'og-banner.html')).href);
    await page.evaluate(async()=>{
      await document.fonts.ready;
      await Promise.all([...document.images].map(image=>image.decode()));
      for(const font of ['600 79px Manrope','800 29px Manrope','500 28px "DM Sans"']){
        const faces=await document.fonts.load(font);
        if(!faces.length||!document.fonts.check(font))throw new Error(`Fonte não carregada: ${font}`);
      }
    });
    const screenshot=await page.locator('.banner').screenshot({type:'png'});
    const output=path.join(__dirname,'../assets/devarity-workspace-og.png');
    await sharp(screenshot).resize(1200,630).flatten({background:'#111214'}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(output);
    const metadata=await sharp(output).metadata();
    console.log(`${output}: ${metadata.width} × ${metadata.height}, PNG`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
