import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import FarmerInvoice from "./FarmerInvoice";
import ReactDOM from "react-dom"; // Added for printing
import { createRoot } from "react-dom/client";

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
      window.location.href = `https://invoice-generator-s4ap.onrender.com/api/download/${fileId}`;
    }
  };

  const handlePrint = async (farmers) => {
    setIsPrinting(true);

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Popup blocked. Please allow popups.");

      const content = farmers
        .map((farmer) => {
          const total = farmer.acres * farmer.ratePerAcre;
          const finalAmount =
            farmer.discount !== "No"
              ? total - parseFloat(farmer.discount.replace("₹", ""))
              : total;

          return `
        <div class="invoice">
          <h2 style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px;">
            INVOICE
          </h2>

          <div style="margin-bottom: 20px;">
            <p><strong>Invoice No:</strong> ${farmer.invoiceNo}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Farmer Details:</h3>
            <p><strong>Name:</strong> ${farmer.name}</p>
            <p><strong>District:</strong> ${farmer.district}</p>
            <p><strong>Region:</strong> ${farmer.region}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Details:</h3>
            <p><strong>Acres:</strong> ${farmer.acres}</p>
            <p><strong>Price per Acre:</strong> ₹${farmer.ratePerAcre}</p>
            <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
            ${
              farmer.discount !== "No"
                ? `<p><strong>Discount:</strong> ₹${farmer.discount.replace(
                    "₹",
                    ""
                  )}</p>`
                : ""
            }
            <p style="font-weight: bold;"><strong>Final Amount:</strong> ₹${finalAmount.toFixed(
              2
            )}</p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-style: italic;">
            <p>Thank you for your cooperation!</p>
          </div>
        </div>
      `;
        })
        .join("");

      printWindow.document.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Farmer Invoice</title>
      <style>
        @media print {
          @page {
            margin: 0.5in;
          }
          body {
            margin: 0;
          }
        }

        body {
          font-family: 'Helvetica Neue', 'Segoe UI', sans-serif;
          color: #333;
          background: #fff;
          padding: 40px;
        }

        .invoice {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          border: 1px solid #ccc;
          border-radius: 8px;
          page-break-after: always;
        }

        .invoice-title {
          text-align: center;
          font-size: 32px;
          font-weight: 500;
          color: #2f2f91;
          letter-spacing: 1px;
          margin-bottom: 40px;
        }

        .top-section, .bottom-section {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          font-size: 14px;
          line-height: 1.6;
        }

        .top-section div, .bottom-section div {
          margin-bottom: 10px;
        }

        .info-label {
          font-weight: bold;
          color: #333;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
          font-size: 14px;
        }

        .invoice-table th {
          background: #dbe5f1;
          color: #2f2f91;
          text-align: left;
          padding: 10px;
          border: 1px solid #ccc;
        }

        .invoice-table td {
          padding: 10px;
          border: 1px solid #ccc;
        }

        .totals {
          float: right;
          margin-top: 30px;
          font-size: 16px;
        }

        .totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .footer {
          text-align: center;
          margin-top: 80px;
          font-size: 13px;
          color: #777;
        }

      </style>
    </head>
    <body>
      ${farmers
        .map((farmer) => {
          const total = farmer.acres * farmer.ratePerAcre;
          const discountValue =
            farmer.discount !== "No"
              ? parseFloat(farmer.discount.replace("₹", ""))
              : 0;
          const finalAmount = total - discountValue;

          return `
          <div class="invoice">
            <div class="invoice-title">INVOICE</div>

            <div class="top-section">
              <div>
                <div><span class="info-label">DATE:</span> ${new Date().toLocaleDateString()}</div>
                <div><span class="info-label">INVOICE #:</span> ${
                  farmer.invoiceNo
                }</div>
                <div><span class="info-label">CUSTOMER ID:</span> ${
                  farmer.serialNo
                }</div>
              </div>
              <div>
                <div><span class="info-label">TO:</span><br>
                  ${farmer.farmerName}<br>
                  ${farmer.address}<br>
                  ${farmer.city}, ${farmer.district}, ${farmer.state}<br>
                  ${farmer.farmerMobile}
                </div>
              </div>
            </div>

            <div class="bottom-section">
              <div><span class="info-label">SALESPERSON:</span> Agri Officer</div>
              <div><span class="info-label">JOB:</span> Land Survey</div>
              <div><span class="info-label">PAYMENT TERMS:</span> Due on receipt</div>
              <div><span class="info-label">DUE DATE:</span> ${new Date().toLocaleDateString()}</div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>QTY</th>
                  <th>DESCRIPTION</th>
                  <th>UNIT PRICE</th>
                  <th>LINE TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${farmer.acres}</td>
                  <td>Land Service - ${farmer.region} Region</td>
                  <td>₹${farmer.ratePerAcre}</td>
                  <td>₹${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div><span>Subtotal:</span><span>₹${total.toFixed(2)}</span></div>
              ${
                discountValue > 0
                  ? `<div><span>Discount:</span><span>-₹${discountValue.toFixed(
                      2
                    )}</span></div>`
                  : ""
              }
              <div><strong>Total:</strong><strong>₹${finalAmount.toFixed(
                2
              )}</strong></div>
            </div>

            <div class="footer">
               
            </div>
          </div>
        `;
        })
        .join("")}
      
      <script>
        setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            console.warn('Print failed:', e);
          } finally {
            setTimeout(() => {
              window.close();
            }, 300);
          }
        }, 500);
      </script>
    </body>
  </html>
`);

      printWindow.document.close();
    } catch (error) {
      console.error("Printing error:", error);
      alert("Printing failed: " + error.message);
    } finally {
      setIsPrinting(false);
    }
  };

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
        Generated Invoices
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 no-print">
        <div className="w-full sm:w-auto">
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
        </div>

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
            onClick={() => handlePrint(safeInvoices)}
            disabled={isPrinting || filteredInvoices.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isPrinting ? "Preparing..." : "Print Invoices"}
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Farmer Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                city
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acres
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount (₹)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice No.
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.invoiceNo || invoice.serialNo}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.serialNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.farmerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.farmerMobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.district}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.acres}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{invoice.finalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.discount === "No"
                          ? ""
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.discount === "No" ? "-" : invoice.discount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {invoice.invoiceNo}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
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
      serialNo: PropTypes.number,
      name: PropTypes.string,
      region: PropTypes.string,
      regionId: PropTypes.number,
      district: PropTypes.string,
      acres: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      discount: PropTypes.string,
      finalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      invoiceNo: PropTypes.string,
    })
  ),
  fileId: PropTypes.string,
};

export default InvoiceSection;
