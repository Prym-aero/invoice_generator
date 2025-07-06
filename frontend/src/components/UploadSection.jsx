import React, { useState, useEffect } from "react";
import axios from "axios";
import StateSelector from "./StateSelector";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const UPLOAD_STORAGE_KEY = "uploadData";

const UploadSection = ({ onSuccess }) => {
  const [farmerFile, setFarmerFile] = useState(null);
  const [pilotFile, setPilotFile] = useState(null);
  const [stateValue, setStateValue] = useState(() => {
    const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
    return saved ? JSON.parse(saved).stateValue : null;
  });

  const [farmersData, setFarmersData] = useState(null);

  const [filteredData, setFilteredData] = useState(() => {
    const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
    return saved ? JSON.parse(saved).filteredData : [];
  });

  const [sets, setSets] = useState(() => {
    const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
    return saved ? JSON.parse(saved).sets : {};
  });

  const [total, setTotal] = useState(() => {
    const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
    return saved ? JSON.parse(saved).total : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFarmerFileChange = (e) => {
    setFarmerFile(e.target.files[0]);
    setError("");
  };

  const handlePilotFileChange = (e) => {
    setPilotFile(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmerFile && !pilotFile) {
      setError("Please select a file");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("farmersFile", farmerFile);
      formData.append("pilotsFile", pilotFile);
      formData.append("state", stateValue);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const {
        farmersData,
        pilotsData,
        sets,
        totalFarmers,
        totalAcres,
        totalPilots,
        id,
      } = response.data;

      console.log(farmersData.slice(0, 5));
      setFilteredData(farmersData);
      setSets(sets || {});

      const totalInfo = {
        farmers: totalFarmers,
        acres: totalAcres,
        pilots: totalPilots,
      };
      setTotal(totalInfo);
      console.log(totalInfo);

      // Store in localStorage
      localStorage.setItem(
        UPLOAD_STORAGE_KEY,
        JSON.stringify({
          stateValue,
          filteredData,
          sets,
          total: totalInfo,
        })
      );

      onSuccess(id, totalInfo, farmersData, pilotsData, sets);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear localStorage on refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(UPLOAD_STORAGE_KEY);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Save to localStorage whenever stateValue changes
  useEffect(() => {
    localStorage.setItem(
      UPLOAD_STORAGE_KEY,
      JSON.stringify({ stateValue, filteredData, sets, total })
    );
  }, [stateValue, filteredData, sets, total]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
        Upload Farmer Data
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Select file */}
          <div className="uploadInputs flex gap-2. justify-evenly">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Farmer CSV/XLS/Excel File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFarmerFileChange}
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Pilot CSV/XLS/Excel File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handlePilotFileChange}
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Select state */}
          <StateSelector onStateValue={setStateValue} stateValue={stateValue} />

          {/* Select region */}
          {/* <div>
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
          </div> */}

          {/* Select district (depends on region) */}
          {/* <div>
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
          </div> */}

          {error && <div className="text-red-600 text-sm py-2">{error}</div>}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!farmerFile || !pilotFile || isLoading}
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
      {filteredData.length >= 0 && (
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
        </div>
      )}
    </div>
  );
};

export default UploadSection;
