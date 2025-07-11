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
  const [filteredData, setFilteredData] = useState(null);
  const [pilotsData, setPilotsData] = useState(null);
  const [setsData, setSetsData] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({
    upload: false,
    budget: false,
    invoices: false,
  });

  const handleGenerate = useCallback((data) => {
    setProcessedData(data);
    setActiveTab("invoices");
    setCompletedSteps((prev) => ({ ...prev, budget: true }));
  }, []);

  const handleTabChange = (tab) => {
    // Only prevent going back to upload tab if it's completed
    if (tab === "upload" && completedSteps.upload) {
      return;
    }
    setActiveTab(tab);
  };

  // Add warning on refresh or navigation
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
        <h1 className="text-3xl font-bold text-blue-600">Farmer Analytics</h1>
        <p className="text-gray-600">
          Generate Analytics with automated budget distribution
        </p>
      </header>

      <nav className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow">
          <TabButton
            active={activeTab === "upload"}
            onClick={() => handleTabChange("upload")}
            disabled={completedSteps.upload}
          >
            Upload Data
          </TabButton>
          <TabButton
            active={activeTab === "budget"}
            onClick={() => handleTabChange("budget")}
            disabled={!fileId}
          >
            Budget Division
          </TabButton>
          <TabButton
            active={activeTab === "invoices"}
            onClick={() => handleTabChange("invoices")}
            disabled={!processedData}
          >
            Generated Analytics
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
              onSuccess={(id, totals, farmersData, pilotsData, sets) => {
                setFileId(id);
                setTotals(totals);
                setFilteredData(farmersData);
                setPilotsData(pilotsData);
                setSetsData(sets);
                setCompletedSteps((prev) => ({ ...prev, upload: true }));
                setActiveTab("budget");
              }}
            />
          )}
          {activeTab === "budget" && fileId && (
            <BudgetSection
              fileId={fileId}
              totals={totals}
              farmersData={filteredData}
              pilotsData={pilotsData}
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
