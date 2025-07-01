import React, { useState } from "react";
import axios from "axios";
import ReactDOMServer from "react-dom/server"; // ✅ <-- ADD THIS
import FarmerInvoice from "./FarmerInvoice";

const SingleInvoicePrint = ({ fileId }) => {
  const [division, setDivision] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!division || !serialNo) {
      setError("Please enter both division and serial number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/get-single-invoice",
        { fileId, division, serialNo }
      );
      // const response = await axios.post(
      //   "https://invoice-generator-s4ap.onrender.com/api/get-single-invoice",
      //   { fileId, division, serialNo }
      // );

      if (response.data.success) {
        setInvoice(response.data.invoice);
      }
    } catch (err) {
      console.error("Invoice search error:", err);
      setError(err.response?.data?.error || "Failed to find invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice for ${invoice.farmerName}</title>
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
  <div class="invoice">
    <div class="invoice-title">INVOICE</div>

    <div class="top-section">
      <div>
        <div><span class="info-label">DATE:</span> ${new Date().toLocaleDateString()}</div>
        <div><span class="info-label">INVOICE #:</span> ${
          invoice.invoiceNo
        }</div>
        <div><span class="info-label">CUSTOMER ID:</span> ${
          invoice.serialNo
        }</div>
      </div>
      <div>
        <div><span class="info-label">TO:</span><br>
          ${invoice.farmerName}<br>
          ${invoice.address}<br>
          ${invoice.city}, ${invoice.district}, ${invoice.state}<br>
          ${invoice.farmerMobile}
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
          <td>${invoice.acres}</td>
          <td>Land Service - ${invoice.region} Region</td>
          <td>₹${invoice.ratePerAcre}</td>
          <td>₹${(invoice.acres * invoice.ratePerAcre).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal:</span><span>₹${(
        invoice.acres * invoice.ratePerAcre
      ).toFixed(2)}</span></div>
      ${
        invoice.discount !== "No"
          ? `<div><span>Discount:</span><span>-₹${parseFloat(
              invoice.discount.replace("₹", "")
            ).toFixed(2)}</span></div>`
          : ""
      }
      <div><strong>Total:</strong><strong>₹${invoice.finalAmount}</strong></div>
    </div>

    <div class="footer">
      Thank you for your business. Please contact us if you have any questions.
    </div>
  </div>

  <script>
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        window.close();
      }, 300);
    }, 500);
  </script>
</body>
</html>
`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Print Single Invoice
      </h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Division (1-5)
          </label>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Division</option>
            <option value="1">1 - Konkan</option>
            <option value="2">2 - Western Maharashtra</option>
            <option value="3">3 - Marathwada</option>
            <option value="4">4 - North Maharashtra</option>
            <option value="5">5 - Vidarbha</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serial Number
          </label>
          <input
            type="text"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            placeholder="Enter serial number (e.g. SR12345)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Searching..." : "Find Invoice"}
        </button>
      </form>

      {invoice && (
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium">Found Invoice:</h3>
            <p>Name: {invoice.farmerName}</p>
            <p>Serial No: {invoice.serialNo}</p>
            <p>Amount: ₹{invoice.finalAmount}</p>
          </div>
          <button
            onClick={handlePrint}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Print Invoice
          </button>
        </div>
      )}
    </div>
  );
};

export default SingleInvoicePrint;
