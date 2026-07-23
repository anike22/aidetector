import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const response = await fetch("https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260604/WhatsApp%20Image%202026-06-04%20at%206.30.20%20AM.jpeg");
const buffer = await response.arrayBuffer();
const image = await Image.decode(new Uint8Array(buffer));

let darkCount = 0;
let edgeCount = 0;
for (let y = 1; y <= image.height; y++) {
  for (let x = 1; x <= image.width; x++) {
    const pixel = image.getPixelAt(x, y);
    const r = (pixel >> 24) & 0xFF;
    const g = (pixel >> 16) & 0xFF;
    const b = (pixel >> 8) & 0xFF;
    
    const max = Math.max(r, g, b);
    if (max < 40) {
        darkCount++;
    } else if (max < 80) {
        edgeCount++;
    }
  }
}
console.log(`Dark (<40): ${darkCount}`);
console.log(`Edge (40-80): ${edgeCount}`);
