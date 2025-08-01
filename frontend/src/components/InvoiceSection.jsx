import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
const API_URL = import.meta.env.VITE_API_ENDPOINT;

// Function to convert number to words (Indian format)
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };

  let result = '';
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    result += convertHundreds(crores) + 'Crore ';
    num %= 10000000;
  }

  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + 'Lakh ';
    num %= 100000;
  }

  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    result += convertHundreds(thousands) + 'Thousand ';
    num %= 1000;
  }

  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim();
};

const InvoiceSection = ({ invoices = [], fileId = "" }) => {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [isPrinting, setIsPrinting] = useState(false);

  // Maharashtra regions configuration matching backend
  const regions = {
    1: "Konkan",
    2: "Western Maharashtra",
    3: "Marathwada",
    4: "North Maharashtra",
    5: "Vidarbha",
  };

  // Ensure we always have an array to work with
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  // Filter invoices based on selected region
  const filteredInvoices =
    selectedRegion === "all"
      ? safeInvoices
      : safeInvoices.filter(
          (inv) => String(inv.regionId) === String(selectedRegion)
        );

  const handleDownload = () => {
    if (fileId) {
      window.location.href = `${API_URL}/download/${fileId}`;
      // window.location.href = `https://invoice-generator-s4ap.onrender.com/api/download/${fileId}`;
    }
  };

  // Fixed PDF generation with proper positioning and no overlaps
  const generatePDF = (farmers) => {
    console.log('PDF Generation - Farmers data:', farmers);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    farmers.forEach((farmer, index) => {
      console.log(`Processing farmer ${index}:`, farmer);
      if (index > 0) {
        pdf.addPage(); // New page for each invoice
      }

      const total = farmer.acres * farmer.ratePerAcre;
      const discountValue = farmer.discount && farmer.discount !== "No" && typeof farmer.discount === 'string'
        ? parseFloat(farmer.discount.replace("₹", ""))
        : 0;
      const finalAmount = farmer.totalCost;
      // Use existing invoice number or generate new one in INV-XXXXX-XX format
      const invoiceNumber = farmer.invoiceNo || farmer.invoiceNumber || (() => {
        const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5 digit number
        const serialNum = String(index + 1).padStart(2, '0'); // 2 digit serial
        return `INV-${randomNum}-${serialNum}`;
      })();

      // Main border
      pdf.setLineWidth(0.5);
      pdf.rect(15, 15, 180, 250);

      // Header - INVOICE (centered)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', pageWidth / 2, 30, { align: 'center' });

      // Company details (left side)
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRYM SOLUTIONS PRIVATE LIMITED', 20, 45);
      pdf.setFont('helvetica', 'normal');
      pdf.text('104, MITTAL TOWER, C WING,', 20, 52);
      pdf.text('NARIMAN POINT,', 20, 59);
      pdf.text('MUMBAI', 20, 66);
      pdf.text('GSTIN/UIN: 27AAMCP5981E1ZZ', 20, 73);
      pdf.text('State Name : Maharashtra, Code : 27', 20, 80);
      pdf.text('E-Mail : info@salamkisan.com', 20, 87);

      // Invoice details table (right side) - Fixed positioning
      const tableX = 125;
      const tableY = 40;
      const cellW1 = 35;
      const cellW2 = 35;
      const cellH = 10;

      // Draw invoice details table with proper structure
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);

      // Row 1: Headers
      pdf.rect(tableX, tableY, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY, cellW2, cellH);
      pdf.text('Invoice No.', tableX + 2, tableY + 7);
      pdf.text('Dated', tableX + cellW1 + 2, tableY + 7);

      // Row 2: Values
      pdf.rect(tableX, tableY + cellH, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH, cellW2, cellH);
      pdf.setFont('helvetica', 'normal');
      pdf.text(invoiceNumber, tableX + 2, tableY + cellH + 7);
      pdf.text(new Date().toLocaleDateString('en-GB'), tableX + cellW1 + 2, tableY + cellH + 7);

      // Row 3: Headers
      pdf.rect(tableX, tableY + cellH * 2, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 2, cellW2, cellH);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Delivery Note', tableX + 2, tableY + cellH * 2 + 7);
      pdf.text('Mode/Terms of Payment', tableX + cellW1 + 2, tableY + cellH * 2 + 7);

      // Row 4: Empty values
      pdf.rect(tableX, tableY + cellH * 3, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 3, cellW2, cellH);

      // Row 5: Headers
      pdf.rect(tableX, tableY + cellH * 4, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 4, cellW2, cellH);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference No. & Date.', tableX + 2, tableY + cellH * 4 + 7);
      pdf.text('Other References', tableX + cellW1 + 2, tableY + cellH * 4 + 7);

      // Row 6: Empty values
      pdf.rect(tableX, tableY + cellH * 5, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 5, cellW2, cellH);

      // Row 7: Headers
      pdf.rect(tableX, tableY + cellH * 6, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 6, cellW2, cellH);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dispatch Doc No.', tableX + 2, tableY + cellH * 6 + 7);
      pdf.text('Delivery Note Date', tableX + cellW1 + 2, tableY + cellH * 6 + 7);

      // Row 8: Empty values
      pdf.rect(tableX, tableY + cellH * 7, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 7, cellW2, cellH);

      // Row 9: Headers
      pdf.rect(tableX, tableY + cellH * 8, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 8, cellW2, cellH);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dispatched through', tableX + 2, tableY + cellH * 8 + 7);
      pdf.text('Destination', tableX + cellW1 + 2, tableY + cellH * 8 + 7);

      // Row 10: Empty values
      pdf.rect(tableX, tableY + cellH * 9, cellW1, cellH);
      pdf.rect(tableX + cellW1, tableY + cellH * 9, cellW2, cellH);

      // Row 11: Terms of Delivery (spans both columns)
      pdf.rect(tableX, tableY + cellH * 10, cellW1 + cellW2, cellH);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Terms of Delivery', tableX + 2, tableY + cellH * 10 + 7);

      // Buyer details
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Buyer (Bill to)', 20, 155);
      pdf.setFont('helvetica', 'normal');
      pdf.text(farmer.farmerName || farmer.name || 'Govind Kamalkishor Hambarde', 20, 163);
      pdf.text('Ner Dhule', 20, 170);
      pdf.text('State Name : Maharashtra, Code : 27', 20, 177);

      // Main service table - Fixed positioning and sizing
      const mainTableY = 185;
      const mainTableW = 170;
      const mainTableH = 60;

      // Column definitions with proper widths
      const colWidths = [15, 65, 20, 20, 15, 12, 23]; // Total = 170
      const colLabels = ['Sl\nNo', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate', 'per', 'Amount'];

      // Draw main table border
      pdf.rect(20, mainTableY, mainTableW, mainTableH);

      // Header row
      let currentX = 20;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);

      colWidths.forEach((width, i) => {
        pdf.rect(currentX, mainTableY, width, 12);
        const lines = colLabels[i].split('\n');
        lines.forEach((line, lineIndex) => {
          pdf.text(line, currentX + 2, mainTableY + 6 + (lineIndex * 3));
        });
        currentX += width;
      });

      // Content row
      const contentY = mainTableY + 12;
      const contentH = 35;
      currentX = 20;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      colWidths.forEach((width, i) => {
        pdf.rect(currentX, contentY, width, contentH);

        // Add content based on column
        if (i === 0) pdf.text('1', currentX + 6, contentY + 8);
        if (i === 1) pdf.text('Agri Drone Spray Service', currentX + 2, contentY + 8);
        if (i === 3) pdf.text(`${farmer.acres.toFixed(2)} Acre`, currentX + 2, contentY + 8);
        if (i === 4) pdf.text(`${farmer.ratePerAcre || 500}.00`, currentX + 2, contentY + 8);
        if (i === 5) pdf.text('Acre', currentX + 2, contentY + 8);
        if (i === 6) {
          pdf.setFontSize(7);
          pdf.text(`${finalAmount.toFixed(2)}`, currentX + 1, contentY + 8);
          pdf.setFontSize(8);
        }

        currentX += width;
      });

      // Total row
      const totalY = contentY + contentH;
      currentX = 20;

      pdf.setFont('helvetica', 'bold');
      colWidths.forEach((width, i) => {
        pdf.rect(currentX, totalY, width, 13);

        if (i === 2) pdf.text('Total', currentX + 2, totalY + 8);
        if (i === 3) pdf.text(`${farmer.acres.toFixed(2)} Acre`, currentX + 2, totalY + 8);
        if (i === 6) {
          pdf.setFontSize(10);
          pdf.text(`${finalAmount.toFixed(2)}`, currentX + 1, totalY + 8);
          pdf.setFontSize(8);
        }

        currentX += width;
      });

      // Amount in words section
      const wordsY = mainTableY + mainTableH + 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Amount Chargeable (in words)', 20, wordsY);
      pdf.text('E. & O.E', 160, wordsY);

      pdf.setFont('helvetica', 'normal');
      const amountInWords = `INR ${numberToWords(Math.floor(finalAmount))} Only`;
      pdf.text(amountInWords, 20, wordsY + 8);

      // Declaration section
      const declY = wordsY + 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Declaration', 20, declY);
      pdf.setFont('helvetica', 'normal');
      pdf.text('We declare that this invoice shows the actual price of', 20, declY + 8);
      pdf.text('the goods described and that all particulars are true', 20, declY + 16);
      pdf.text('and correct.', 20, declY + 24);

      // Company signature (right side)
      pdf.text('for PRYM SOLUTIONS PRIVATE LIMITED', 110, declY + 8);
      pdf.text('Authorised Signatory', 125, declY + 24);

      // Footer
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('This is a Computer Generated Invoice', pageWidth / 2, declY + 35, { align: 'center' });
    });

    return pdf;
  };

  const handlePrint = async (farmers) => {
    setIsPrinting(true);

    try {
      const pdf = generatePDF(farmers);
      pdf.save(`invoices_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Removed old print function - using PDF generation instead

  // Add beforeunload event listener to clear localStorage on refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("budgetData");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 print-content">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Generated Analytics
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 no-print">
        {/* <div className="w-full sm:w-auto">
          <label htmlFor="region" className="sr-only">
            Region
          </label>
          <select
            id="region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Regions</option>
            {Object.entries(regions).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div> */}

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownload}
            disabled={!fileId}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download Excel
          </button>

          <button
            onClick={() => handlePrint(filteredInvoices)}
            disabled={isPrinting || filteredInvoices.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                clipRule="evenodd"
              />
            </svg>
            {isPrinting ? "Generating PDF..." : "Print All Invoices"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taluka
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acres
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Crop
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                used_medicine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pincode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Pilot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-blue-600">
                      {invoice.invoiceNo || invoice.invoiceNumber || (() => {
                        const randomNum = Math.floor(Math.random() * 90000) + 10000;
                        const serialNum = String(index + 1).padStart(2, '0');
                        return `INV-${randomNum}-${serialNum}`;
                      })()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.farmerName || invoice.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.mobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.district}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.taluka}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.acres}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.crop}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.used_medicine?.join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.pincode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.assignedPilot}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.scheduledDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.perRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handlePrint([invoice])}
                      disabled={isPrinting}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Print
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {safeInvoices.length === 0
                    ? "No invoices generated yet"
                    : "No invoices found for selected region"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Print styles */}
      {/* <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100%;
            font-size: 11px;
          }
          th,
          td {
            padding: 4px 8px;
          }
        }
      `}</style> */}
    </div>
  );
};

InvoiceSection.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      serialNumber: PropTypes.string,
      farmerName: PropTypes.string,
      farmerMobile: PropTypes.string,
      state: PropTypes.string,
      district: PropTypes.string,
      taluka: PropTypes.string,
      pincode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      assignedPilot: PropTypes.string,
      scheduledDate: PropTypes.string,
    })
  ),
  fileId: PropTypes.string,
};

export default InvoiceSection;
