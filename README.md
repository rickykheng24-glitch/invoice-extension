# Quick Invoice Generator

A Chrome extension to create and download professional PDF invoices instantly — no account, no backend, no internet required.

![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-blue) ![Version](https://img.shields.io/badge/version-1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Logo upload** — add your business logo to the PDF header (PNG/JPEG/GIF, saved automatically)
- **Business name** — displayed in the PDF header next to your logo
- **Multi-currency** — 10 currencies: USD, EUR, GBP, MYR, SGD, AUD, CAD, JPY, INR, IDR
- **Dynamic line items** — add/remove rows, live subtotal/tax/total calculation
- **Tax field** — optional percentage-based tax
- **Notes** — payment instructions, bank details, or any custom text
- **Draw signature** — sign with your mouse, rendered in the PDF
- **Auto-increment invoice numbers** — INV-001, INV-002, ... saved between sessions
- **Auto-save** — business info and currency preference remembered across sessions

---

## Preview

```
┌─────────────────────────────────────────────┐
│  [LOGO] Your Business Name      INVOICE      │
│                                 #INV-001     │
│                                 2026-05-19   │
├─────────────────────────────────────────────┤
│  FROM                  BILL TO              │
│  Your Name             Client Name          │
│  email@you.com         client@email.com     │
├─────────────────────────────────────────────┤
│  DESCRIPTION       QTY    RATE    AMOUNT    │
│  Web Design          1   $500    $500.00    │
│  Logo Design         2    $80    $160.00    │
├─────────────────────────────────────────────┤
│                    Subtotal      $660.00    │
│                    Tax (6%)       $39.60    │
│                    TOTAL         $699.60    │
├─────────────────────────────────────────────┤
│  Notes: Payment due within 30 days          │
│                         [Signature]         │
│                         ___________         │
│                    Authorized Signature     │
└─────────────────────────────────────────────┘
```

---

## Installation

### Load unpacked (Developer mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `invoice-extension` folder
6. Pin the extension from the toolbar puzzle icon

---

## Usage

1. Click the extension icon in the Chrome toolbar
2. Fill in your business info (saved automatically for next time)
3. Add client details, invoice number, date, and due date
4. Select your currency
5. Add line items with description, quantity, and rate
6. Set tax % if needed
7. Upload your logo (optional)
8. Draw your signature (optional)
9. Click **Generate PDF** — downloads instantly

---

## Tech Stack

| Tool | Purpose |
|---|---|
| HTML / CSS / JS | Extension UI |
| [jsPDF 2.5.1](https://github.com/parallax/jsPDF) | PDF generation |
| Chrome Storage API | Persist business info, logo, currency |
| Chrome MV3 | Extension platform |

No frameworks. No build tools. No external requests.

---

## Project Structure

```
invoice-extension/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── lib/
│   └── jspdf.umd.min.js
├── manifest.json
├── popup.html
├── popup.css
└── popup.js
```

---

## License

MIT — free to use, modify, and distribute.
