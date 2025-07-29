import React, { useState, useEffect } from "react";
import axios from "axios";
import StateSelector from "./StateSelector";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
const API_URL = import.meta.env.VITE_API_ENDPOINT;

const UPLOAD_STORAGE_KEY = "uploadData";

// Utility function to safely clear localStorage if it's corrupted
const clearCorruptedStorage = () => {
  try {
    localStorage.removeItem(UPLOAD_STORAGE_KEY);
    console.log('Cleared corrupted localStorage data');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

// Utility function to check localStorage quota and clean up if needed
const checkAndCleanStorage = () => {
  try {
    // Try to get current storage usage
    const testKey = 'test_quota_check';
    const testData = 'x'.repeat(1024 * 1024); // 1MB test data
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old data');
      clearCorruptedStorage();
    }
  }
};

const UploadSection = ({ onSuccess }) => {
  const [farmerFile, setFarmerFile] = useState(null);
  const [pilotFile, setPilotFile] = useState(null);
  const [stateValue, setStateValue] = useState(() => {
    try {
      const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
      return saved ? JSON.parse(saved).stateValue : null;
    } catch (error) {
      console.error('Failed to parse saved stateValue:', error);
      return null;
    }
  });



  const [filteredData, setFilteredData] = useState(() => {
    try {
      const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Check if we have the old format (full filteredData) or new format (summary)
        return parsedData.filteredData || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to parse saved filteredData:', error);
      return [];
    }
  });

  const [sets] = useState(() => {
    try {
      const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
      return saved ? JSON.parse(saved).sets || {} : {};
    } catch (error) {
      console.error('Failed to parse saved sets:', error);
      return {};
    }
  });

  const [total, setTotal] = useState(() => {
    try {
      const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
      return saved ? JSON.parse(saved).total : null;
    } catch (error) {
      console.error('Failed to parse saved total:', error);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check localStorage on component mount and clean up if needed
  useEffect(() => {
    checkAndCleanStorage();
  }, []);

  const handleFarmerFileChange = (e) => {
    setFarmerFile(e.target.files[0]);
    setError("");
  };

  const handlePilotFileChange = (e) => {
    setPilotFile(e.target.files[0]);
    setError("");
  };

  const splitCsvBySize = async (file, maxChunkSize = 9 * 1024 * 1024) => {
    const text = await file.text();
    const rows = text.split(/\r?\n/);
    const header = rows[0];
    const dataRows = rows.slice(1);

    const chunks = [];
    let currentChunkRows = [];
    let currentSize = 0;

    for (const row of dataRows) {
      const rowSize = new Blob([row + "\n"]).size; // include newline size
      if (currentSize + rowSize > maxChunkSize) {
        chunks.push(currentChunkRows);
        currentChunkRows = [];
        currentSize = 0;
      }
      currentChunkRows.push(row);
      currentSize += rowSize;
    }
    if (currentChunkRows.length) chunks.push(currentChunkRows);

    return chunks.map((chunkRows, idx) => {
      const csvString = [header, ...chunkRows].join("\n");
      return new File([csvString], `${file.name.split(".")[0]}_part${idx + 1}.csv`, {
        type: "text/csv",
      });
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmerFile || !pilotFile) {
      setError("Please select farmer and pilot files");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Split farmer file into chunks under 9MB
      const farmerChunks = await splitCsvBySize(farmerFile);

      // 2. Upload each farmer chunk to Cloudinary, collect URLs
      const farmerUrls = [];
      for (const chunk of farmerChunks) {
        const url = await uploadToCloudinary(chunk);
        farmerUrls.push(url);
      }

      // 3. Upload pilot file to Cloudinary
      const pilotUrl = await uploadToCloudinary(pilotFile);

      // 4. Send all URLs + state to backend /uploadMultiple endpoint
      const response = await axios.post(`${API_URL}/uploadMultiple`, {
        farmerUrls,
        pilotUrl,
        state: stateValue,
      });

      const { farmersData, pilotsData, totalFarmers, totalAcres, totalPilots } = response.data;

      setFilteredData(farmersData);
      setTotal({ farmers: totalFarmers, acres: totalAcres, pilots: totalPilots });

      // Store data safely to localStorage
      try {
        const dataToStore = {
          stateValue,
          filteredDataSummary: {
            length: farmersData.length,
            totalAcres: farmersData.reduce((sum, f) => sum + (parseFloat(f.acres) || 0), 0),
            state: farmersData[0]?.state || null
          },
          total: { farmers: totalFarmers, acres: totalAcres, pilots: totalPilots },
        };

        localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(dataToStore));
      } catch (error) {
        console.error('Failed to save upload data to localStorage:', error);
        // Store minimal data if full storage fails
        try {
          localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify({
            stateValue,
            total: { farmers: totalFarmers, acres: totalAcres, pilots: totalPilots },
          }));
        } catch (fallbackError) {
          console.error('Even minimal localStorage save failed:', fallbackError);
        }
      }

      onSuccess(response.data.id, { farmers: totalFarmers, acres: totalAcres, pilots: totalPilots }, farmersData, pilotsData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
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
    try {
      // Only store essential data to avoid quota exceeded error
      const dataToStore = {
        stateValue,
        // Only store a summary of filteredData instead of the full dataset
        filteredDataSummary: {
          length: filteredData.length,
          totalAcres: filteredData.reduce((sum, f) => sum + (parseFloat(f.acres) || 0), 0),
          state: filteredData[0]?.state || null
        },
        // Only store essential parts of sets if it's not too large
        sets: Object.keys(sets).length > 0 ?
          Object.fromEntries(
            Object.entries(sets).slice(0, 10) // Limit to first 10 entries
          ) : {},
        total
      };

      const dataString = JSON.stringify(dataToStore);

      // Check if the data size is reasonable (less than 4MB to be safe)
      if (dataString.length < 4 * 1024 * 1024) {
        localStorage.setItem(UPLOAD_STORAGE_KEY, dataString);
      } else {
        console.warn('Data too large for localStorage, skipping storage');
        // Store only the most essential data
        localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify({
          stateValue,
          total
        }));
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // If localStorage fails, try to store minimal data
      try {
        localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify({
          stateValue,
          total
        }));
      } catch (fallbackError) {
        console.error('Even minimal localStorage save failed:', fallbackError);
        // Clear localStorage if it's corrupted
        localStorage.removeItem(UPLOAD_STORAGE_KEY);
      }
    }
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
