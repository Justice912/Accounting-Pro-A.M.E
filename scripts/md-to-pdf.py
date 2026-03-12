#!/usr/bin/env python3
"""Convert LEARN-THE-CODE.md to a styled PDF."""

import markdown
from weasyprint import HTML

INPUT = "LEARN-THE-CODE.md"
OUTPUT = "LEARN-THE-CODE.pdf"

with open(INPUT, "r", encoding="utf-8") as f:
    md_text = f.read()

html_body = markdown.markdown(
    md_text,
    extensions=["tables", "fenced_code", "codehilite", "toc"],
)

full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: A4;
    margin: 2cm 2.5cm;
    @bottom-center {{
      content: "Page " counter(page) " of " counter(pages);
      font-size: 9pt;
      color: #666;
    }}
  }}
  body {{
    font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a2e;
  }}
  h1 {{
    color: #0f172a;
    font-size: 22pt;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 8px;
    margin-top: 30px;
    page-break-after: avoid;
  }}
  h2 {{
    color: #1e3a5f;
    font-size: 16pt;
    border-bottom: 2px solid #60a5fa;
    padding-bottom: 5px;
    margin-top: 25px;
    page-break-after: avoid;
  }}
  h3 {{
    color: #2563eb;
    font-size: 13pt;
    margin-top: 20px;
    page-break-after: avoid;
  }}
  h4 {{
    color: #3b82f6;
    font-size: 11.5pt;
    margin-top: 15px;
    page-break-after: avoid;
  }}
  p {{
    margin: 8px 0;
    text-align: justify;
  }}
  code {{
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 1px 5px;
    font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
    font-size: 9.5pt;
    color: #be185d;
  }}
  pre {{
    background-color: #0f172a;
    color: #e2e8f0;
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 9pt;
    line-height: 1.5;
    overflow-x: auto;
    page-break-inside: avoid;
    margin: 12px 0;
  }}
  pre code {{
    background: none;
    border: none;
    color: #e2e8f0;
    padding: 0;
  }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }}
  th {{
    background-color: #1e3a5f;
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: bold;
  }}
  td {{
    border: 1px solid #cbd5e1;
    padding: 6px 12px;
  }}
  tr:nth-child(even) {{
    background-color: #f8fafc;
  }}
  blockquote {{
    border-left: 4px solid #3b82f6;
    margin: 12px 0;
    padding: 8px 16px;
    background-color: #eff6ff;
    color: #1e40af;
  }}
  strong {{
    color: #0f172a;
  }}
  ul, ol {{
    margin: 8px 0;
    padding-left: 24px;
  }}
  li {{
    margin: 4px 0;
  }}
  hr {{
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 20px 0;
  }}
  a {{
    color: #2563eb;
    text-decoration: none;
  }}
  /* Cover styling for first h1 */
  body > h1:first-child {{
    text-align: center;
    font-size: 28pt;
    margin-top: 120px;
    margin-bottom: 10px;
    border-bottom: 4px solid #3b82f6;
  }}
  body > h2:first-of-type {{
    text-align: center;
    font-size: 14pt;
    color: #64748b;
    border: none;
    margin-bottom: 80px;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""

HTML(string=full_html).write_pdf(OUTPUT)
print(f"PDF generated: {OUTPUT}")
