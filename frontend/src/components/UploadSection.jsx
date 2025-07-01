import React, { useState, useEffect } from "react";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const UploadSection = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [total, setTotal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sets, setSets] = useState({});

  // State for dropdowns
  const [stateValue, setStateValue] = useState("Maharashtra");
  const [regionValue, setRegionValue] = useState("");
  const [districtValue, setDistrictValue] = useState("");

  // Dropdown options
  const regions = [
    "Konkan",
    "Western Maharashtra",
    "Marathwada",
    "North Maharashtra",
    "Vidarbha",
  ];

  const districts = {
    Konkan: ["Ratnagiri", "Sindhudurg", "Raigad", "Thane"],
    "Western Maharashtra": ["Pune", "Satara", "Sangli", "Kolhapur"],
    Marathwada: ["Aurangabad", "Beed", "Jalna", "Latur"],
    "North Maharashtra": ["Nashik", "Dhule", "Nandurbar", "Jalgaon"],
    Vidarbha: ["Nagpur", "Amravati", "Wardha", "Chandrapur"],
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("state", stateValue);
      formData.append("region", regionValue);
      formData.append("district", districtValue);

      const response = await axios.post(
        `${API_URL}/upload`, // change to your backend URL
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("upload response:", response.data.message);
      

      setFilteredData(response.data.filteredData || []);
      setSets(response.data.sets || {});

      onSuccess(
        response.data.id,
        {
          farmers: response.data.totalFarmers,
          acres: response.data.totalAcres,
        },
        response.data.filteredData,
        response.data.sets
      );

      setTotal({
        farmers: response.data.totalFarmers,
        acres: response.data.totalAcres,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Upload Farmer Data
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Select file */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Excel/CSV File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isLoading}
            />
          </div>

          {/* Select state */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select State
            </label>
            <select
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={isLoading}
            >
              <option value="Maharashtra">Maharashtra</option>
              {/* You can add more states here */}
            </select>
          </div>

          {/* Select region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Region
            </label>
            <select
              value={regionValue}
              onChange={(e) => {
                setRegionValue(e.target.value);
                setDistrictValue(""); // Reset district on region change
              }}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={isLoading}
            >
              <option value="">-- Select Region --</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Select district (depends on region) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select District
            </label>
            <select
              value={districtValue}
              onChange={(e) => setDistrictValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={!regionValue || isLoading}
            >
              <option value="">-- Select District --</option>
              {regionValue &&
                districts[regionValue]?.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </select>
          </div>

          {error && <div className="text-red-600 text-sm py-2">{error}</div>}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!file || isLoading}
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
                Uploading...
              </>
            ) : (
              "Upload & Process"
            )}
          </button>
        </div>
      </form>
      {filteredData.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Location Summary Box */}
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📍 Location Summary
            </h3>

            {filteredData[0]?.state && (
              <p>
                <strong>State:</strong> {filteredData[0].state}
              </p>
            )}

            {filteredData[0]?.region && (
              <p>
                <strong>Region:</strong> {filteredData[0].region}
              </p>
            )}

            {filteredData.some((f) => f.district) && (
              <p>
                <strong>District(s):</strong>{" "}
                {[...new Set(filteredData.map((f) => f.district))].join(", ")}
              </p>
            )}

            <p>
              <strong>Total Farmers:</strong> {filteredData.length}
            </p>
            <p>
              <strong>Total Acres:</strong>{" "}
              {filteredData
                .reduce((sum, f) => sum + (parseFloat(f.acres) || 0), 0)
                .toFixed(2)}
            </p>
          </div>

          {/* Set Summary Box */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded shadow-sm">
              <p className="text-green-800 font-semibold">✅ Full Data</p>
              <p>{sets.fullData?.length || 0} farmers</p>
            </div>

            <div className="bg-yellow-100 border-l-4 border-yellow-600 p-4 rounded shadow-sm">
              <p className="text-yellow-800 font-semibold">🚫 No Crop Data</p>
              <p>{sets.noCropData?.length || 0} farmers</p>
            </div>

            <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded shadow-sm">
              <p className="text-blue-800 font-semibold">
                🪙 Half Acres (&lt; 0.1)
              </p>
              <p>{sets.halfData?.length || 0} farmers</p>
            </div>

            <div className="bg-pink-100 border-l-4 border-pink-600 p-4 rounded shadow-sm">
              <p className="text-pink-800 font-semibold">❓ Incomplete State</p>
              <p>{sets.incompleteData?.length || 0} farmers</p>
            </div>

            <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded shadow-sm">
              <p className="text-red-800 font-semibold">❌ Unknown Address</p>
              <p>{sets.unknownData?.length || 0} farmers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
