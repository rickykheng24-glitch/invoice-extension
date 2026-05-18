const { jsPDF } = window.jspdf;

// Currency map: code -> symbol
const CURRENCIES = {
  USD: '$', EUR: '€', GBP: '£', MYR: 'RM ', SGD: 'S$',
  AUD: 'A$', CAD: 'C$', JPY: '¥', INR: '₹', IDR: 'Rp ',
};

const getSym = () => CURRENCIES[currencyEl.value] || '$';

// Elements
const fromName     = document.getElementById('from-name');
const fromEmail    = document.getElementById('from-email');
const fromAddress  = document.getElementById('from-address');
const toName       = document.getElementById('to-name');
const toEmail      = document.getElementById('to-email');
const toAddress    = document.getElementById('to-address');
const invoiceNum   = document.getElementById('invoice-number');
const invoiceDate  = document.getElementById('invoice-date');
const dueDate      = document.getElementById('due-date');
const taxRateEl    = document.getElementById('tax-rate');
const currencyEl   = document.getElementById('currency');
const notesEl      = document.getElementById('notes');
const itemsCont    = document.getElementById('items-container');
const subtotalEl   = document.getElementById('subtotal');
const taxAmountEl  = document.getElementById('tax-amount');
const taxLabelEl   = document.getElementById('tax-label');
const totalEl      = document.getElementById('total');

// Set default dates
const today = new Date();
invoiceDate.value = today.toISOString().split('T')[0];
const due = new Date(today);
due.setDate(due.getDate() + 30);
dueDate.value = due.toISOString().split('T')[0];

// Load saved business info, last invoice number, and currency
chrome.storage.local.get(['fromName', 'fromEmail', 'fromAddress', 'lastInvoiceNum', 'currency'], (data) => {
  if (data.fromName)    fromName.value    = data.fromName;
  if (data.fromEmail)   fromEmail.value   = data.fromEmail;
  if (data.fromAddress) fromAddress.value = data.fromAddress;
  if (data.lastInvoiceNum) {
    const next = parseInt(data.lastInvoiceNum, 10) + 1;
    invoiceNum.value = `INV-${String(next).padStart(3, '0')}`;
  }
  if (data.currency) currencyEl.value = data.currency;
  updateRateHeader();
  recalculate();
});

// Auto-save business info
[fromName, fromEmail, fromAddress].forEach(el => {
  el.addEventListener('change', () => {
    chrome.storage.local.set({
      fromName: fromName.value,
      fromEmail: fromEmail.value,
      fromAddress: fromAddress.value,
    });
  });
});

// Currency change
function updateRateHeader() {
  document.getElementById('rate-header').textContent = `Rate (${getSym().trim()})`;
}

currencyEl.addEventListener('change', () => {
  chrome.storage.local.set({ currency: currencyEl.value });
  updateRateHeader();
  recalculate();
});

// Item management
function addItem(desc = '', qty = 1, rate = '') {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text" class="item-desc" placeholder="Description" value="${desc}">
    <input type="number" class="item-qty" value="${qty}" min="1" step="1">
    <input type="number" class="item-rate" placeholder="0.00" value="${rate}" min="0" step="0.01">
    <span class="item-amount">${getSym()}0.00</span>
    <button class="remove-item" title="Remove">×</button>
  `;
  row.querySelector('.remove-item').addEventListener('click', () => {
    row.remove();
    recalculate();
  });
  row.querySelector('.item-qty').addEventListener('input', recalculate);
  row.querySelector('.item-rate').addEventListener('input', recalculate);
  itemsCont.appendChild(row);
  recalculate();
}

document.getElementById('add-item').addEventListener('click', () => addItem());
addItem(); // start with one row

// Recalculate totals
function recalculate() {
  let subtotal = 0;
  document.querySelectorAll('.item-row').forEach(row => {
    const qty    = parseFloat(row.querySelector('.item-qty').value)  || 0;
    const rate   = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;
    row.querySelector('.item-amount').textContent = `${getSym()}${amount.toFixed(2)}`;
    subtotal += amount;
  });
  const taxPct = parseFloat(taxRateEl.value) || 0;
  const tax    = subtotal * taxPct / 100;
  const total  = subtotal + tax;
  subtotalEl.textContent  = `${getSym()}${subtotal.toFixed(2)}`;
  taxAmountEl.textContent = `${getSym()}${tax.toFixed(2)}`;
  taxLabelEl.textContent  = `Tax (${taxPct}%)`;
  totalEl.textContent     = `${getSym()}${total.toFixed(2)}`;
}

taxRateEl.addEventListener('input', recalculate);

// Clear form
document.getElementById('clear-btn').addEventListener('click', () => {
  toName.value = toEmail.value = toAddress.value = notesEl.value = '';
  taxRateEl.value = '0';
  itemsCont.innerHTML = '';
  addItem();
  recalculate();
});

// Generate PDF
document.getElementById('generate-pdf').addEventListener('click', () => {
  const sym     = getSym();
  const doc     = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW   = doc.internal.pageSize.getWidth();
  const margin  = 18;
  const cW      = pageW - margin * 2;
  const blue    = [41, 98, 255];
  const dark    = [20, 20, 35];
  const gray    = [110, 110, 130];
  const lgray   = [245, 246, 250];

  // Header bar
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', margin, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${invoiceNum.value}`, pageW - margin, 16, { align: 'right' });
  doc.text(invoiceDate.value, pageW - margin, 23, { align: 'right' });
  doc.text(`Due: ${dueDate.value}`, pageW - margin, 30, { align: 'right' });

  let y = 50;

  // From / To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...blue);
  doc.text('FROM', margin, y);
  doc.text('BILL TO', pageW / 2 + 2, y);

  y += 5;
  const addBlock = (lines, x, startY) => {
    let ly = startY;
    lines.forEach((line, i) => {
      if (!line) return;
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(i === 0 ? 10 : 9);
      doc.setTextColor(i === 0 ? dark[0] : gray[0], i === 0 ? dark[1] : gray[1], i === 0 ? dark[2] : gray[2]);
      doc.text(line, x, ly);
      ly += i === 0 ? 6 : 5;
    });
    return ly;
  };

  const fromEnd = addBlock([fromName.value, fromEmail.value, fromAddress.value], margin, y);
  const toEnd   = addBlock([toName.value, toEmail.value, toAddress.value], pageW / 2 + 2, y);
  y = Math.max(fromEnd, toEnd) + 8;

  // Divider
  doc.setDrawColor(220, 220, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Items table header
  doc.setFillColor(...blue);
  doc.rect(margin, y, cW, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DESCRIPTION',         margin + 3,           y + 6);
  doc.text('QTY',                 margin + cW * 0.62,   y + 6, { align: 'center' });
  doc.text('RATE',                margin + cW * 0.78,   y + 6, { align: 'center' });
  doc.text('AMOUNT',              margin + cW,           y + 6, { align: 'right' });
  y += 9;

  // Items rows
  let subtotal = 0;
  document.querySelectorAll('.item-row').forEach((row, i) => {
    const desc   = row.querySelector('.item-desc').value  || '-';
    const qty    = parseFloat(row.querySelector('.item-qty').value)  || 0;
    const rate   = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;
    subtotal += amount;

    if (i % 2 === 0) {
      doc.setFillColor(...lgray);
      doc.rect(margin, y, cW, 8, 'F');
    }

    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(desc, cW * 0.55);
    doc.text(descLines[0], margin + 3, y + 5.5);
    doc.text(String(qty),                          margin + cW * 0.62,  y + 5.5, { align: 'center' });
    doc.text(`${sym}${rate.toFixed(2)}`,           margin + cW * 0.78,  y + 5.5, { align: 'center' });
    doc.text(`${sym}${amount.toFixed(2)}`,         margin + cW,          y + 5.5, { align: 'right' });
    y += 8;
  });

  y += 4;

  // Totals
  const taxPct = parseFloat(taxRateEl.value) || 0;
  const tax    = subtotal * taxPct / 100;
  const total  = subtotal + tax;
  const tX     = margin + cW * 0.55;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Subtotal:', tX, y);
  doc.setTextColor(...dark);
  doc.text(`${sym}${subtotal.toFixed(2)}`, margin + cW, y, { align: 'right' });
  y += 7;

  if (taxPct > 0) {
    doc.setTextColor(...gray);
    doc.text(`Tax (${taxPct}%):`, tX, y);
    doc.setTextColor(...dark);
    doc.text(`${sym}${tax.toFixed(2)}`, margin + cW, y, { align: 'right' });
    y += 7;
  }

  // Total box
  doc.setFillColor(...blue);
  doc.roundedRect(tX - 3, y - 2, cW - (tX - margin) + 3, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL', tX + 2, y + 6.5);
  doc.text(`${sym}${total.toFixed(2)}`, margin + cW - 2, y + 6.5, { align: 'right' });
  y += 18;

  // Notes
  if (notesEl.value.trim()) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...blue);
    doc.text('NOTES', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(notesEl.value.trim(), cW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // Footer
  doc.setDrawColor(220, 220, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, 282, pageW - margin, 282);
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageW / 2, 287, { align: 'center' });

  // Save & store invoice number
  const numMatch = invoiceNum.value.match(/\d+$/);
  if (numMatch) {
    chrome.storage.local.set({ lastInvoiceNum: numMatch[0] });
  }

  doc.save(`${invoiceNum.value}.pdf`);
});
