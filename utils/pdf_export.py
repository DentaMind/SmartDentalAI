from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from PIL import Image
import io
import os

class PDFExporter:
    def __init__(self, output_dir: str = "reports"):
        """Initialize PDF exporter with output directory"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Load custom fonts if needed
        self.font_config = FontConfiguration()
        
    def optimize_images(self, html_content: str, quality: int = 85) -> str:
        """
        Optimize images in HTML content for PDF export
        
        Args:
            html_content: HTML string containing image tags
            quality: JPEG quality (1-100), lower = smaller file
            
        Returns:
            HTML string with optimized image data URLs
        """
        from bs4 import BeautifulSoup
        import requests
        import base64
        
        soup = BeautifulSoup(html_content, 'html.parser')
        images = soup.find_all('img')
        
        for img in images:
            src = img.get('src', '')
            if not src:
                continue
                
            try:
                # Handle both URLs and local files
                if src.startswith(('http://', 'https://')):
                    response = requests.get(src)
                    img_data = response.content
                else:
                    with open(src.lstrip('/'), 'rb') as f:
                        img_data = f.read()
                
                # Optimize image
                img = Image.open(io.BytesIO(img_data))
                
                # Convert RGBA to RGB if needed
                if img.mode == 'RGBA':
                    bg = Image.new('RGB', img.size, 'white')
                    bg.paste(img, mask=img.split()[3])
                    img = bg
                
                # Resize if too large (max 1500px width)
                if img.width > 1500:
                    ratio = 1500 / img.width
                    img = img.resize((1500, int(img.height * ratio)), Image.Resampling.LANCZOS)
                
                # Save optimized image
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=quality, optimize=True)
                
                # Convert to data URL
                img_base64 = base64.b64encode(buffer.getvalue()).decode()
                img['src'] = f'data:image/jpeg;base64,{img_base64}'
                
            except Exception as e:
                print(f"Failed to optimize image {src}: {e}")
                continue
        
        return str(soup)
    
    def generate_pdf(
        self,
        html_content: str,
        metadata: Dict[str, Any],
        watermark: Optional[str] = None,
        compress: bool = True,
        image_quality: int = 85
    ) -> Path:
        """
        Generate PDF from HTML content with metadata and optional watermark
        
        Args:
            html_content: HTML string to convert
            metadata: Dictionary of metadata (patient_id, date, etc.)
            watermark: Optional watermark text
            compress: Whether to apply compression optimizations
            image_quality: JPEG quality for image compression (1-100)
            
        Returns:
            Path to generated PDF file
        """
        # Optimize images if compression is enabled
        if compress:
            html_content = self.optimize_images(html_content, image_quality)
        
        # Add watermark if specified
        if watermark:
            watermark_css = CSS(string=f"""
                @page {{
                    @top-center {{
                        content: "{watermark}";
                        font-family: sans-serif;
                        font-size: 24pt;
                        color: rgba(128, 128, 128, 0.3);
                        transform: rotate(-45deg);
                        position: absolute;
                        top: 50%;
                        left: 50%;
                    }}
                }}
            """)
        else:
            watermark_css = None
            
        # Generate filename from metadata
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        patient_id = metadata.get("patient_id", "unknown")
        filename = f"dental_report_{patient_id}_{timestamp}.pdf"
        output_path = self.output_dir / filename
        
        # PDF compression settings
        pdf_options = {
            'optimize_size': compress,
            'dpi': 150 if compress else 300,
            'zoom': 1.0,
        }
        
        # Convert HTML to PDF
        html = HTML(string=html_content)
        html.write_pdf(
            output_path,
            stylesheets=[watermark_css] if watermark_css else None,
            font_config=self.font_config,
            # Add PDF metadata
            metadata={
                "Title": f"Dental Assessment Report - {patient_id}",
                "Author": "DentaMind AI",
                "Creator": "DentaMind Clinical Report System",
                "Producer": "WeasyPrint",
                "Keywords": "dental,assessment,ai,report",
                **metadata
            },
            **pdf_options
        )
        
        return output_path 