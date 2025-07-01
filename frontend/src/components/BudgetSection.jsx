import React, { useState, useEffect } from "react";
import axios from "axios";

function generateRandomSerial() {
  const letters = "SR";
  const numbers = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return letters + numbers;
}

const BudgetSection = ({
  fileId,
  totals,
  filteredData,
  setsData,
  onGenerate,
}) => {
  // Initialize state from localStorage if available
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).budget : "";
  });
  const [divisions, setDivisions] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).divisions : [0, 0, 0, 0, 0];
  });
  const [discountAmount, setDiscountAmount] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).discountAmount : "";
  });
  const [recipientsCount, setRecipientsCount] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).recipientsCount : "";
  });
  const [acres, setAcres] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).acres : "";
  }); // <-- new

  const [preferredSerialNo, setPreferredSerialNo] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    if (saved) return JSON.parse(saved).preferredSerialNo;

    // Generate a random serial number if not already saved
    const randomSerial = generateRandomSerial();
    return randomSerial;
  });

  const [acresDivision, setAcresDivision] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).acresDivision : [0, 0, 0, 0, 0];
  }); // <-- new

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(() => {
    const saved = localStorage.getItem("budgetData");
    return saved ? JSON.parse(saved).submitted : false;
  });

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

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const budgetData = {
      budget,
      divisions,
      discountAmount,
      recipientsCount,
      preferredSerialNo,
      acres,
      acresDivision,
      submitted,
    };
    localStorage.setItem("budgetData", JSON.stringify(budgetData));
  }, [
    budget,
    divisions,
    discountAmount,
    recipientsCount,
    preferredSerialNo,
    acres,
    acresDivision,
    submitted,
  ]);

  const handleAcresChange = (e) => {
    const value = e.target.value;
    setAcres(value); // You'll need a `useState` for `acres`

    if (value && !isNaN(value)) {
      const total = parseFloat(value);
      const divided = [];
      const baseAmount = total * 0.2;

      for (let i = 0; i < 5; i++) {
        const variation = (Math.random() * 0.3 - 0.15) * baseAmount; // +/-15%
        let part = Math.max(baseAmount + variation, total * 0.05); // Min 5%
        divided.push(part);
      }

      const sum = divided.reduce((a, b) => a + b, 0);
      const normalized = divided.map((amount) => (amount / sum) * total);
      const rounded = normalized.map((amount) => Math.round(amount));

      const finalSum = rounded.reduce((a, b) => a + b, 0);
      if (finalSum !== total) {
        rounded[4] += total - finalSum; // adjust last one
      }

      setAcresDivision(rounded.map((num) => Math.max(1, num))); // make sure min 1
    } else {
      setAcresDivision([0, 0, 0, 0, 0]);
    }
  };

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    setBudget(value);

    if (value && !isNaN(value)) {
      const total = parseFloat(value);
      const divided = [];
      const baseAmount = total * 0.2;

      for (let i = 0; i < 5; i++) {
        const variation = (Math.random() * 0.3 - 0.15) * baseAmount;
        let part = Math.max(baseAmount + variation, total * 0.05);
        divided.push(part);
      }

      const sum = divided.reduce((a, b) => a + b, 0);
      const normalized = divided.map((amount) => (amount / sum) * total);
      const rounded = normalized.map((amount) => Math.round(amount));

      const finalSum = rounded.reduce((a, b) => a + b, 0);
      if (finalSum !== total) {
        rounded[4] += total - finalSum;
      }

      setDivisions(rounded.map((num) => Math.max(0, num)));
    } else {
      setDivisions([0, 0, 0, 0, 0]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!budget || divisions.some((div) => div <= 0)) {
      setError("Please enter valid budget amounts");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-invoice",
        {
          fileId,
          divisions,
          discountAmount: parseFloat(discountAmount),
          recipientsCount: parseInt(recipientsCount),
          preferredSerialNo: preferredSerialNo || null,
          acresDivision,
        }
      );
      // const response = await axios.post(
      //   "https://invoice-generator-s4ap.onrender.com/api/generate-invoice",
      //   {
      //     fileId,
      //     divisions,
      //     discountAmount: parseFloat(discountAmount),
      //     recipientsCount: parseInt(recipientsCount),
      //     preferredSerialNo: preferredSerialNo || null,
      //     acresDivision,
      //   }
      // );

      if (response.data.success) {
        onGenerate(response.data.invoices);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Invoice generation error:", err);
      setError(err.response?.data?.error || "Invoice generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  const handleReset = () => {
    // Clear all saved data
    localStorage.removeItem("budgetData");
    setBudget("");
    setDivisions([0, 0, 0, 0, 0]);
    setDiscountAmount("");
    setRecipientsCount("");
    setPreferredSerialNo("");
    setSubmitted(false);
    setError("");
  };

  return (
    <>
      <form
        onSubmit={handleGenerate}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Budget Division
          </h2>
          {submitted && (
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Summary section - added at the top */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Farmers Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Total Farmers
              </p>
              <p className="text-lg font-semibold">{totals.farmers}</p>
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Total Acres
              </p>
              <p className="text-lg font-semibold">{totals.acres}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {submitted ? (
            <>
              <div className="border-b pb-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Budget
                </h3>
                <p className="text-lg font-semibold">₹{budget}</p>
              </div>

              <div className="border-b pb-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Regional Divisions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {divisions.map((amount, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3"
                    >
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Division {index + 1}
                      </p>
                      <div className="w-full px-2 py-2 border border-gray-300 rounded-md text-center font-medium bg-gray-50">
                        ₹{amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b pb-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Discount Amount
                </h3>
                <p className="text-lg">₹{discountAmount}</p>
              </div>

              <div className="border-b pb-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Recipients per Division
                </h3>
                <p className="text-lg">{recipientsCount}</p>
              </div>

              <div className="border-b pb-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Starting Serial Number
                </h3>
                <p className="text-lg">
                  {preferredSerialNo || "Not specified"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Details
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  value={budget}
                  min={100}
                  max={10000000000}
                  onChange={handleBudgetChange}
                  placeholder="Enter total budget amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Budget Divisions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {divisions.map((amount, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3"
                    >
                      <label className="block text-xs font-medium text-gray-500 mb-1 text-center">
                        Division {index + 1}
                      </label>
                      <div className="w-full px-2 py-2 border border-gray-300 rounded-md text-center font-medium bg-gray-50">
                        ₹{amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Total Acres
                </label>
                <input
                  type="number"
                  value={acres}
                  onChange={handleAcresChange}
                  placeholder="e.g. 100000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Acres Divisions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {acresDivision.map((val, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3"
                    >
                      <label className="block text-xs font-medium text-gray-500 mb-1 text-center">
                        Division {index + 1}
                      </label>
                      <div className="w-full px-2 py-2 border border-gray-300 rounded-md text-center font-medium bg-gray-50">
                        {val.toString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Recipients per Division
                </label>
                <input
                  type="number"
                  value={recipientsCount}
                  onChange={(e) => setRecipientsCount(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Starting Serial Number
                </label>
                <input
                  type="text"
                  value={preferredSerialNo}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .slice(0, 20);
                    setPreferredSerialNo(value);
                  }}
                  placeholder="ex. SR12341"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the starting number for generated invoices (max
                  20 alphanumeric characters)
                </p>
                {preferredSerialNo.length >= 10 && (
                  <p className="text-xs text-red-500 mt-1">
                    Maximum length reached (10 characters)
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !budget}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating Invoices...
                    </>
                  ) : (
                    "Apply Discounts & Generate Invoices"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </>
  );
};

export default BudgetSection;
