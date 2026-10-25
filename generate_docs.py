import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_guide_docx(output_path):
    doc = Document()

    # Page Margins (1 inch all sides)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    wine_burgundy = RGBColor(114, 28, 43)    # #721C2B
    gold_accent = RGBColor(180, 139, 71)     # #B48B47
    charcoal = RGBColor(30, 41, 59)          # #1E293B
    slate_gray = RGBColor(100, 116, 139)     # #64748B

    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_icon = title_p.add_run("🍷 GRAND CRU WINE SHOP ERP\n")
    run_icon.font.name = "Georgia"
    run_icon.font.size = Pt(26)
    run_icon.font.bold = True
    run_icon.font.color.rgb = wine_burgundy

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = sub_p.add_run("Multi-Branch Wine Outlets, POS Billing, Cellar Inventory, Banking & Accounting\n")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = gold_accent

    run_desc = sub_p.add_run("Complete Installation, Desktop Setup & Cloud Deployment Guide (Hindi & English)\n")
    run_desc.font.name = "Arial"
    run_desc.font.size = Pt(10)
    run_desc.font.color.rgb = slate_gray

    # Divider line
    div_p = doc.add_paragraph()
    div_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    div_run = div_p.add_run("―" * 55)
    div_run.font.color.rgb = gold_accent

    # SECTION 1: SYSTEM OVERVIEW
    h1 = doc.add_heading(level=1)
    run_h1 = h1.add_run("1. System Overview & Architecture (सिस्टम क्या है?)")
    run_h1.font.name = "Georgia"
    run_h1.font.color.rgb = wine_burgundy

    p1 = doc.add_paragraph()
    p1.add_run("Grand Cru Wine Shop ERP ").bold = True
    p1.add_run(
        "ek modern, full-stack, enterprise-grade multi-branch retail management aur double-entry accounting software hai. "
        "Ise single wine shop se lekar multiple cities me spread retail boutiques aur central cellars tak easily manage karne ke liye design kiya gaya hai.\n"
    )

    # Core Modules Table
    table1 = doc.add_table(rows=1, cols=3)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table1.rows[0].cells
    hdr_cells[0].text = "Module"
    hdr_cells[1].text = "Core Functionality"
    hdr_cells[2].text = "Key Benefits"

    for c in hdr_cells:
        set_cell_background(c, "721C2B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(10)

    modules_data = [
        ("Multi-Branch", "Manage retail stores, waterfront boutiques & central warehouses", "Consolidated + individual outlet KPIs & analytics"),
        ("POS Billing", "Fast barcode/SKU checkout, cash tender calculator, split payment", "Instant thermal receipts & formal A4 tax invoices"),
        ("Wine Catalog", "Vintages, grape varietals, regions, ABV%, tasting notes & pairings", "Detailed sommelier profile & multi-tier pricing"),
        ("Inventory & Transfers", "Multi-branch stock, cellar bin locations, inter-branch movement", "Real-time stock deduction, breakage & cork taint log"),
        ("Purchasing & Wineries", "Supplier management, purchase bills, auto stock intake", "Automated Accounts Payable (AP) & wire disbursements"),
        ("Banking & Cash", "Commercial checking, petty cash drawers, card settlements", "Safe cash drops, inter-account transfers & bank reconciliation"),
        ("Receipts & Payments", "Customer receivable collections & operating expense vouchers", "Cash flow control with full audit trail"),
        ("Accounting (GL)", "Automated double-entry journals, Trial Balance, P&L, Balance Sheet", "100% balanced books complying with standard GAAP/IFRS")
    ]

    for m, f, b in modules_data:
        row_cells = table1.add_row().cells
        row_cells[0].text = m
        row_cells[1].text = f
        row_cells[2].text = b
        set_cell_background(row_cells[0], "FDF2F4")
        for idx, c in enumerate(row_cells):
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = charcoal
                    if idx == 0:
                        r.font.bold = True

    doc.add_paragraph()

    # SECTION 2: LOCAL INSTALLATION ON WINDOWS
    h2 = doc.add_heading(level=1)
    run_h2 = h2.add_run("2. Local PC Installation & Setup (Computer Par Setup)")
    run_h2.font.name = "Georgia"
    run_h2.font.color.rgb = wine_burgundy

    p2 = doc.add_paragraph()
    p2.add_run("Aapke computer par application already fully built aur configured hai:\n")
    p2.add_run("• Project Location: ").bold = True
    p2.add_run("C:\\Users\\DELL BP\\wine-shop-management\n")
    p2.add_run("• Database Engine: ").bold = True
    p2.add_run("SQLite 3 (File: data\\wineshop.db) with WAL high-concurrency mode\n")
    p2.add_run("• Backend Server: ").bold = True
    p2.add_run("Node.js Express (Port 5000)\n")
    p2.add_run("• Frontend Client: ").bold = True
    p2.add_run("React 19 + Tailwind CSS + Lucide Icons (Production Built)\n")

    p2_cmd = doc.add_paragraph()
    p2_cmd.add_run("Server Start Karne Ki Commands:\n").bold = True
    
    code_box = doc.add_paragraph()
    code_box.paragraph_format.left_indent = Inches(0.5)
    run_code = code_box.add_run(
        "# Terminal / PowerShell me chalayein:\n"
        "cd \"C:\\Users\\DELL BP\\wine-shop-management\"\n"
        "npm start\n\n"
        "# Browser me kholein:\n"
        "http://localhost:5000"
    )
    run_code.font.name = "Consolas"
    run_code.font.size = Pt(9.5)
    run_code.font.color.rgb = wine_burgundy

    # SECTION 3: DESKTOP & MOBILE APP
    h3 = doc.add_heading(level=1)
    run_h3 = h3.add_run("3. Desktop App & Mobile Phone Par Chalana")
    run_h3.font.name = "Georgia"
    run_h3.font.color.rgb = wine_burgundy

    p3 = doc.add_paragraph()
    p3.add_run("Aap is ERP ko 3 alag-alag tarike se bina browser ke App ki tarah use kar sakte hain:\n")

    p3_1 = doc.add_paragraph()
    p3_1.add_run("A. 1-Click Desktop App (Desktop Shortcut):\n").bold = True
    p3_1.add_run(
        "Aapke Windows Desktop par humne ek direct file create kar di hai:\n"
        "👉 File: Grand Cru Wine ERP.bat\n"
        "Is par double-click karte hi ye server ko automatically start karke application ko ek "
        "Standalone Windows Application Window me open karta hai (bina kisi URL bar ya address bar ke).\n"
    )

    p3_2 = doc.add_paragraph()
    p3_2.add_run("B. Google Chrome / Edge 'Install App' (PWA):\n").bold = True
    p3_2.add_run(
        "1. Google Chrome ya Microsoft Edge me http://localhost:5000 kholein.\n"
        "2. Address bar ke right side par 'Install App' (🖥️ Icon) par click karein.\n"
        "3. App aapke Windows Start Menu aur Taskbar me pin ho jayegi aur native desktop software ki tarah chalegi.\n"
    )

    p3_3 = doc.add_paragraph()
    p3_3.add_run("C. Shop Counter Mobile / Tablet / iPad Par Chalana:\n").bold = True
    p3_3.add_run(
        "Shop me counter par tablet ya mobile se billing karne ke liye:\n"
        "1. Apne mobile/tablet ko computer wale Wi-Fi network se connect karein.\n"
        "2. Mobile browser me ye IP address dalein:\n"
        "   👉 http://192.168.29.31:5000\n"
        "3. Mobile browser menu me 'Add to Home screen' (Install App) chunein. Mobile screen par Wine icon aa jayega!\n"
    )

    # SECTION 4: CLOUD DEPLOYMENT ON RENDER.COM
    h4 = doc.add_heading(level=1)
    run_h4 = h4.add_run("4. Cloud Deployment: Render.com Setup Guide (Online Live Kaise Karein)")
    run_h4.font.name = "Georgia"
    run_h4.font.color.rgb = wine_burgundy

    p4 = doc.add_paragraph()
    p4.add_run(
        "Agar aapki branches alag-alag cities me hain (jaise Delhi, Mumbai, New York) aur internet ke zariye real-time centralized data chahiye, "
        "toh Render.com par 100% Free 24/7 hosting setup karein:\n"
    )

    steps_data = [
        ("Step 1", "GitHub Repository", "GitHub.com par free account banayein aur ek nayi repository ('wine-shop-erp') create karke PC ka code push karein."),
        ("Step 2", "Render.com Login", "Render.com par jayein aur 'Sign in with GitHub' karein taaki GitHub account link ho jaye."),
        ("Step 3", "New Web Service", "Render dashboard par 'New +' button dabakar 'Web Service' select karein aur apni repository connect karein."),
        ("Step 4", "Configuration Settings", "Name: grand-cru-wine-erp\nRuntime: Node\nBuild Command: npm install && npm run build\nStart Command: npm start\nInstance: Free ($0/mo)"),
        ("Step 5", "Persistent Disk (Important)", "Disks option me 'Add Disk' karein -> Name: wine-data, Mount Path: /app/data, Size: 1 GB (Isse aapka database permanent save rahega)."),
        ("Step 6", "Deploy Web Service", "'Deploy Web Service' par click karein. 2-3 minute me aapka live public URL generate ho jayega (e.g. https://grand-cru-wine-erp.onrender.com).")
    ]

    table2 = doc.add_table(rows=1, cols=3)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    h2_cells = table2.rows[0].cells
    h2_cells[0].text = "Step #"
    h2_cells[1].text = "Action"
    h2_cells[2].text = "Detailed Instructions"

    for c in h2_cells:
        set_cell_background(c, "B48B47")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(10)

    for s, a, d in steps_data:
        r_cells = table2.add_row().cells
        r_cells[0].text = s
        r_cells[1].text = a
        r_cells[2].text = d
        set_cell_background(r_cells[0], "F7F4EA")
        for idx, c in enumerate(r_cells):
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = charcoal
                    if idx < 2:
                        r.font.bold = True

    doc.add_paragraph()

    # SECTION 5: DAILY OPERATIONAL WORKFLOW
    h5 = doc.add_heading(level=1)
    run_h5 = h5.add_run("5. Daily Operational Workflow (Shop Daily Use Kaise Karein)")
    run_h5.font.name = "Georgia"
    run_h5.font.color.rgb = wine_burgundy

    wf_items = [
        ("A. Subah Store Open Hone Par: ", "Banking tab me jaakar Cash Drawer open balance verify karein aur Dashboard par stock levels check karein."),
        ("B. Counter Billing (POS): ", "POS tab me wine search/scan karein -> Customer chunein -> Payment mode (Cash, Card, QR) select karein -> Print Receipt dabayein. Stock aur Accounts automatically update ho jayenge."),
        ("C. New Wine Shipment Aane Par: ", "Purchases tab me 'Record Inward Wine Purchase' karein. Supplier bill enter karte hi cellar stock badh jayega aur vendor payables create ho jayenge."),
        ("D. Branch me Stock Kam Hone Par: ", "Inventory -> 'Inter-Branch Transfers' me jakar Central Warehouse se dispatch transfer request banayein."),
        ("E. Broken / Corked Bottle: ", "Inventory -> 'Breakage & Spoilage' me bottle write-off karein. Automatic accounting entry banegi."),
        ("F. Shaam Ko Store Band Hone Par: ", "Banking me 'Fund Transfer / Safe Drop' karke cash counter drawer se commercial bank account me transfer karein aur Accounting me P&L verify karein.")
    ]

    for title, desc in wf_items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        r_t = p.add_run(title)
        r_t.bold = True
        r_t.font.color.rgb = wine_burgundy
        r_d = p.add_run(desc)
        r_d.font.color.rgb = charcoal

    # Footer note
    doc.add_paragraph()
    ft_p = doc.add_paragraph()
    ft_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ft_run = ft_p.add_run("✨ Grand Cru Wine Shop ERP • Engineered for Precision Wine Retail & Multi-Branch Accounting ✨")
    ft_run.font.size = Pt(9)
    ft_run.font.italic = True
    ft_run.font.color.rgb = slate_gray

    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    desktop_dir = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\DELL BP"), "Desktop")
    desktop_file = os.path.join(desktop_dir, "Grand_Cru_Wine_ERP_Installation_Guide.docx")
    project_file = "C:\\Users\\DELL BP\\wine-shop-management\\Grand_Cru_Wine_ERP_Installation_Guide.docx"
    
    create_guide_docx(desktop_file)
    create_guide_docx(project_file)
