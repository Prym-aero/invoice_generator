import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiPercent,
  FiHash,
  FiRefreshCw,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_ENDPOINT;

const generateRandomSerial = () => {
  const letters = "SR";
  const numbers = Math.floor(10000 + Math.random() * 90000);
  return letters + numbers;
};

const INDIAN_DISTRICTS = [
  "Ahmednagar",
  "Akola",
  "Amravati",
  "Aurangabad",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Chh. Sambhajinagar",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Osmanabad",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal",
];

const MAHARASHTRA_CROPS = [
  "Sugarcane",
  "Cotton",
  "Soybean",
  "Turmeric",
  "Rice",
  "Wheat",
  "Jowar",
  "Bajra",
  "Pulses",
  "Oilseeds",
  "Maize",
  "Groundnut",
  "Sunflower",
  "Fruits",
  "Vegetables",
];

const BudgetSection = ({ fileId, farmersData, pilotsData, onGenerate }) => {
  const initialFormData = {
    budget: "",
    rate: "",
    selectedDistrict: "",
    recipientsCount: "",
    startDate: "",
    endDate: "",
    preferredSerialNo: generateRandomSerial(),
    crops: [{ name: "", percentage: "" }],
    landSizePercentages: { small: "", medium: "", large: "" },
    productUsePercentages: {
      pesticide: "",
      fertilizer: "",
      pgr: "",
      biosimulant: "",
    },
  };

  const [formData, setFormData] = useState(() => {
    try {
      const savedData = localStorage.getItem("budgetFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (
          parsedData &&
          typeof parsedData === "object" &&
          "crops" in parsedData &&
          "landSizePercentages" in parsedData &&
          "productUsePercentages" in parsedData
        ) {
          return {
            ...initialFormData,
            ...parsedData,
            crops: parsedData.crops?.length
              ? parsedData.crops
              : initialFormData.crops,
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse saved form data", e);
    }
    return initialFormData;
  });

  useEffect(() => {
    try {
      if (
        formData.budget ||
        formData.rate ||
        formData.selectedDistrict ||
        formData.recipientsCount ||
        formData.startDate ||
        formData.endDate ||
        formData.crops.some((c) => c.name || c.percentage) ||
        Object.values(formData.landSizePercentages).some((v) => v) ||
        Object.values(formData.productUsePercentages).some((v) => v)
      ) {
        localStorage.setItem("budgetFormData", JSON.stringify(formData));
      }
    } catch (e) {
      console.error("Failed to save form data", e);
    }
  }, [formData]);

  const [farmerCount, setFarmerCount] = useState(0);
  const [pilotCount, setPilotCount] = useState(0);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [filteredPilots, setFilteredPilots] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const normalize = (str) => str?.toLowerCase().trim();

    if (formData.selectedDistrict && farmersData && pilotsData) {
      const farmersInDistrict = farmersData.filter(
        (farmer) =>
          normalize(farmer.district) === normalize(formData.selectedDistrict) &&
          normalize(farmer.state) === "maharashtra"
      );

      const pilotsInDistrict = pilotsData.filter(
        (pilot) =>
          pilot.district &&
          normalize(pilot.district) === normalize(formData.selectedDistrict)
      );

      setFarmerCount(farmersInDistrict.length);
      setPilotCount(pilotsInDistrict.length);
      setFilteredFarmers(farmersInDistrict);
      setFilteredPilots(pilotsInDistrict);
    } else {
      setFarmerCount(0);
      setPilotCount(0);
      setFilteredFarmers([]);
      setFilteredPilots([]);
    }
  }, [formData.selectedDistrict, farmersData, pilotsData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCropChange = (index, field, value) => {
    const updatedCrops = [...formData.crops];
    updatedCrops[index][field] = value;
    setFormData((prev) => ({ ...prev, crops: updatedCrops }));
  };

  const addCropField = () => {
    setFormData((prev) => ({
      ...prev,
      crops: [...prev.crops, { name: "", percentage: "" }],
    }));
  };

  const removeCropField = (index) => {
    if (formData.crops.length > 1) {
      setFormData((prev) => ({
        ...prev,
        crops: prev.crops.filter((_, i) => i !== index),
      }));
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all form data? This cannot be undone."
      )
    ) {
      setFormData(initialFormData);
      localStorage.removeItem("budgetFormData");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/generate`, {
        fileId,
        totalBudget: parseFloat(formData.budget),
        rate: parseFloat(formData.rate),
        district: formData.selectedDistrict,
        crops: formData.crops.map((crop) => ({
          ...crop,
          percentage: parseFloat(crop.percentage),
        })),
        landSizePercentages: {
          small: parseFloat(formData.landSizePercentages.small),
          medium: parseFloat(formData.landSizePercentages.medium),
          large: parseFloat(formData.landSizePercentages.large),
        },
        productUsePercentages: {
          pesticide: parseFloat(formData.productUsePercentages.pesticide),
          fertilizer: parseFloat(formData.productUsePercentages.fertilizer),
          pgr: parseFloat(formData.productUsePercentages.pgr),
          biosimulant: parseFloat(formData.productUsePercentages.biosimulant),
        },
        dateRange: {
          start: formData.startDate,
          end: formData.endDate,
        },
        startSerial: formData.preferredSerialNo,
      });

      onGenerate(response.data.sampleData);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to generate dispatch plan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white">
                  Dispatch Plan Configuration
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Configure parameters for farmer selection and budget
                  allocation
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-blue-500 text-sm transition-colors"
                title="Reset form"
              >
                <FiRefreshCw className="mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {error && (
              <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-3 rounded-r">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Budget & District */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Card */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiDollarSign className="mr-2 text-blue-600" />
                    Budget Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Budget (₹)
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIndianRupeeSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          min={10000}
                          max={10000000}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate per Acre (₹)
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIndianRupeeSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="rate"
                          value={formData.rate}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          min={100}
                          max={1000}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* District Card */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiMapPin className="mr-2 text-blue-600" />
                    District Selection
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select District
                      </label>
                      <Select
                        options={INDIAN_DISTRICTS.map((d) => ({
                          value: d,
                          label: d,
                        }))}
                        value={
                          formData.selectedDistrict
                            ? {
                                value: formData.selectedDistrict,
                                label: formData.selectedDistrict,
                              }
                            : null
                        }
                        onChange={(opt) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectedDistrict: opt?.value || "",
                          }))
                        }
                        placeholder="Select district"
                        classNamePrefix="react-select"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-blue-600">
                          Available Farmers
                        </p>
                        <p className="text-xl font-bold text-blue-800">
                          {farmerCount}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-green-600">
                          Available Pilots
                        </p>
                        <p className="text-xl font-bold text-green-800">
                          {pilotCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Dates & Serial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dates Card */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiCalendar className="mr-2 text-blue-600" />
                    Date Range
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className="block w-full pl-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          className="block w-full pl-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Serial Number Card */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiHash className="mr-2 text-blue-600" />
                    Serial Number
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Serial
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiHash className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="preferredSerialNo"
                        value={formData.preferredSerialNo}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^a-zA-Z0-9]/g, "")
                            .slice(0, 20);
                          setFormData((prev) => ({
                            ...prev,
                            preferredSerialNo: value,
                          }));
                        }}
                        className="block w-full pl-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., SR10001"
                        required
                        maxLength={20}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Starting number for generated invoices
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Crops */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FiPercent className="mr-2 text-blue-600" />
                  Crop Distribution
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {formData.crops.map((crop, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded-md border border-gray-200"
                    >
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Crop
                          </label>
                          <Select
                            options={MAHARASHTRA_CROPS.map((c) => ({
                              value: c,
                              label: c,
                            }))}
                            value={
                              crop.name
                                ? { value: crop.name, label: crop.name }
                                : null
                            }
                            onChange={(opt) =>
                              handleCropChange(index, "name", opt?.value || "")
                            }
                            placeholder="Select crop"
                            classNamePrefix="react-select"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Percentage
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <input
                              type="number"
                              value={crop.percentage}
                              onChange={(e) =>
                                handleCropChange(
                                  index,
                                  "percentage",
                                  e.target.value
                                )
                              }
                              className="block w-full py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0-100"
                              min="0"
                              max="100"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <FiPercent className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-1">
                          {index === formData.crops.length - 1 && (
                            <button
                              type="button"
                              onClick={addCropField}
                              className="text-xs inline-flex items-center px-2 py-1 border border-transparent rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                            >
                              <FiPlus className="h-3 w-3 mr-1" /> Add
                            </button>
                          )}
                          {formData.crops.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCropField(index)}
                              className="text-xs inline-flex items-center px-2 py-1 border border-transparent rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                            >
                              <FiTrash2 className="h-3 w-3 mr-1" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Land Size & Product Use */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Land Size */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Landholding Distribution (%)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "small", label: "Small (0-2 acres)" },
                      { key: "medium", label: "Med (3-10 acres)" },
                      { key: "large", label: "Large (10+ acres)" },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {item.label}
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="number"
                            value={formData.landSizePercentages[item.key]}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                landSizePercentages: {
                                  ...prev.landSizePercentages,
                                  [item.key]: e.target.value,
                                },
                              }))
                            }
                            className="block w-full py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0-100"
                            min="0"
                            max="100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <FiPercent className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Use */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Product Usage (%)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "pesticide", label: "Pesticide" },
                      { key: "fertilizer", label: "Fertilizer" },
                      { key: "pgr", label: "PGR" },
                      { key: "biosimulant", label: "Biosimulant" },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {item.label}
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="number"
                            value={formData.productUsePercentages[item.key]}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                productUsePercentages: {
                                  ...prev.productUsePercentages,
                                  [item.key]: e.target.value,
                                },
                              }))
                            }
                            className="block w-full py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0-100"
                            min="0"
                            max="100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <FiPercent className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Generating Dispatch Plan...
                    </span>
                  ) : (
                    "Generate Dispatch Plan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;
