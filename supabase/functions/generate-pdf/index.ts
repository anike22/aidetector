import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const { title, content, type = 'content_brief' } = await req.json();
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([600, 800]);
    let yOffset = 750;
    const margin = 50;
    
    // Title
    page.drawText(title || 'Report', {
      x: margin,
      y: yOffset,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.4)
    });
    
    yOffset -= 40;
    
    // Handle multi-line content
    const lines = content ? content.split('\n') : [];
    
    for (const line of lines) {
      if (yOffset < 50) {
        page = pdfDoc.addPage([600, 800]);
        yOffset = 750;
      }
      
      const isHeader = line.startsWith('#');
      const cleanLine = line.replace(/#/g, '').trim();
      
      if (!cleanLine) {
        yOffset -= 10;
        continue;
      }
      
      // Extremely simple text wrapping
      const words = cleanLine.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = (isHeader ? boldFont : font).widthOfTextAtSize(testLine, isHeader ? 14 : 11);
        
        if (width > 500) {
          page.drawText(currentLine, {
            x: margin,
            y: yOffset,
            size: isHeader ? 14 : 11,
            font: isHeader ? boldFont : font,
          });
          currentLine = word;
          yOffset -= 20;
          if (yOffset < 50) {
            page = pdfDoc.addPage([600, 800]);
            yOffset = 750;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yOffset,
          size: isHeader ? 14 : 11,
          font: isHeader ? boldFont : font,
        });
        yOffset -= (isHeader ? 25 : 15);
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    
    return new Response(JSON.stringify({ success: true, pdfBase64: base64 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
