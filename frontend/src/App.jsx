import React, { useState, useEffect, useCallback } from "react";
import UploadSection from "./components/UploadSection";
import BudgetSection from "./components/BudgetSection";
import InvoiceSection from "./components/InvoiceSection";
import SingleInvoicePrint from "./components/SingleInvoicePrint";

const App = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [fileId, setFileId] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [totals, setTotals] = useState({ farmers: 0, acres: 0 });
  const [fileterdData, setFilteredData] = useState(null);
  const [setsData, setSetsData] = useState(null);

  const handleGenerate = useCallback((data) => {
    setProcessedData(data);
    setActiveTab("invoices");
  }, []);

  // ✅ Add warning on refresh or navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (fileId || processedData) {
        e.preventDefault();
        e.returnValue = ""; // Required for most modern browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [fileId, processedData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600">
          Bill Generator
        </h1>
        <p className="text-gray-600">
          Generate invoices with automated budget distribution
        </p>
      </header>

      <nav className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow">
          <TabButton
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
          >
            Upload Data
          </TabButton>
          <TabButton
            active={activeTab === "budget"}
            onClick={() => setActiveTab("budget")}
            disabled={!fileId}
          >
            Budget Division
          </TabButton>
          <TabButton
            active={activeTab === "invoices"}
            onClick={() => setActiveTab("invoices")}
            disabled={!processedData}
          >
            Generate Invoices
          </TabButton>
          <TabButton
            active={activeTab === "single-invoice"}
            onClick={() => setActiveTab("single-invoice")}
            disabled={!processedData}
          >
            Print Single Invoice
          </TabButton>
        </div>
      </nav>

      <main className="flex justify-center">
        <div
          className={
            activeTab === "invoices"
              ? "w-[80vw] mx-auto"
              : "max-w-5xl w-full mx-auto"
          }
        >
          {activeTab === "upload" && (
            <UploadSection
              onSuccess={(id, totals, filteredData, sets) => {
                setFileId(id);
                setTotals(totals);
                setFilteredData(filteredData);
                setSetsData(sets);
                // setActiveTab("budget");
              }}
            />
          )}
          {activeTab === "budget" && fileId && (
            <BudgetSection
              fileId={fileId}
              totals={totals}
              fileterdData={fileterdData}
              setsData={setsData}
              onGenerate={handleGenerate}
            />
          )}
          {activeTab === "invoices" && processedData && (
            <InvoiceSection invoices={processedData} fileId={fileId} />
          )}
          {activeTab === "single-invoice" && processedData && (
            <SingleInvoicePrint fileId={fileId} />
          )}
        </div>
      </main>
    </div>
  );
};

const TabButton = ({ children, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium text-sm ${
      active
        ? "bg-blue-100 text-blue-700 shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

export default App;
