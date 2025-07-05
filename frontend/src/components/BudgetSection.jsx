// // 💡 Replace everything in BudgetSection.jsx with this
// import React, { useState } from "react";
// import axios from "axios";
// import Select from "react-select";
// import { useEffect } from "react";

// function generateRandomSerial() {
//   const letters = "SR";
//   const numbers = Math.floor(10000 + Math.random() * 90000);
//   return letters + numbers;
// }

// const INDIAN_DISTRICTS = [
//   "Ahmednagar",
//   "Akola",
//   "Amravati",
//   "Aurangabad",
//   "Beed",
//   "Bhandara",
//   "Buldhana",
//   "Chandrapur",
//   "Dhule",
//   "Gadchiroli",
//   "Gondia",
//   "Hingoli",
//   "Jalgaon",
//   "Jalna",
//   "Kolhapur",
//   "Latur",
//   "Mumbai City",
//   "Mumbai Suburban",
//   "Nagpur",
//   "Nanded",
//   "Nandurbar",
//   "Nashik",
//   "Osmanabad",
//   "Palghar",
//   "Parbhani",
//   "Pune",
//   "Raigad",
//   "Ratnagiri",
//   "Sangli",
//   "Satara",
//   "Sindhudurg",
//   "Solapur",
//   "Thane",
//   "Wardha",
//   "Washim",
//   "Yavatmal",
// ];

// const BudgetSection = ({ fileId, onGenerate }) => {
//   const [budget, setBudget] = useState("");
//   const [rate, setRate] = useState("");
//   const [selectedDistrict, setSelectedDistrict] = useState("");

//   const [recipientsCount, setRecipientsCount] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const [preferredSerialNo, setPreferredSerialNo] = useState("");

//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const [crops, setCrops] = useState([{ name: "", percentage: "" }]);
//   const [landSizePercentages, setLandSizePercentages] = useState({
//     small: "",
//     medium: "",
//     large: "",
//   });
//   const [productUsePercentages, setProductUsePercentages] = useState({
//     pesticide: "",
//     fertilizer: "",
//     pgr: "",
//     biosimulant: "",
//   });

//   useEffect(() => {
//     const serialNumber = generateRandomSerial();
//     setPreferredSerialNo(serialNumber);
//   }, []);

//   const handleCropChange = (index, field, value) => {
//     const updated = [...crops];
//     updated[index][field] = value;
//     setCrops(updated);
//   };

//   const addCropField = () => {
//     setCrops([...crops, { name: "", percentage: "" }]);
//   };

//   const removeCropField = (index) => {
//     setCrops(crops.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (
//       !fileId ||
//       !budget ||
//       !rate ||
//       !selectedDistrict ||
//       !recipientsCount ||
//       !startDate ||
//       !endDate
//     ) {
//       setError("Please fill all required fields.");
//       return;
//     }

//     setError("");
//     setIsLoading(true);

//     try {
//       const response = await axios.post("http://localhost:5000/api/generate", {
//         fileId,
//         totalBudget: parseFloat(budget),
//         rate: parseFloat(rate),
//         district: selectedDistrict,
//         numberOfFarmers: parseInt(recipientsCount),
//         crops,
//         landSizePercentages,
//         productUsePercentages,
//         dateRange: { start: startDate, end: endDate },
//         startSerial: preferredSerialNo,
//       });

//       if (response.data.success) {
//         console.log(response.data.sampleData);
//         onGenerate(response.data.sampleData);
//       }
//     } catch (err) {
//       setError(err?.response?.data?.error || "Something went wrong.");
//       console.error(err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white p-6 rounded shadow-md max-w-4xl mx-auto"
//     >
//       <h2 className="text-xl font-semibold mb-4">Farmer Targeting Inputs</h2>

//       {error && (
//         <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Total Budget (₹)
//           </label>
//           <input
//             type="number"
//             value={budget}
//             onChange={(e) => setBudget(e.target.value)}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Rate per Acre (₹)
//           </label>
//           <input
//             type="number"
//             value={rate}
//             onChange={(e) => setRate(e.target.value)}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">District</label>
//           <Select
//             options={INDIAN_DISTRICTS.map((d) => ({ value: d, label: d }))}
//             value={
//               selectedDistrict
//                 ? { value: selectedDistrict, label: selectedDistrict }
//                 : null
//             }
//             onChange={(opt) => setSelectedDistrict(opt?.value || "")}
//             placeholder="Select district"
//             isClearable
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Number of Farmers
//           </label>
//           <input
//             type="number"
//             value={recipientsCount}
//             onChange={(e) => setRecipientsCount(e.target.value)}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">Start Date</label>
//           <input
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">End Date</label>
//           <input
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>
//       </div>

//       <hr className="my-6" />

//       <h3 className="font-medium mb-2">Crop Types & Percentages</h3>
//       {crops.map((crop, index) => (
//         <div key={index} className="flex gap-2 mb-2">
//           <input
//             type="text"
//             placeholder="Crop name"
//             value={crop.name}
//             onChange={(e) => handleCropChange(index, "name", e.target.value)}
//             className="flex-1 border p-2 rounded"
//           />
//           <input
//             type="number"
//             placeholder="%"
//             value={crop.percentage}
//             onChange={(e) =>
//               handleCropChange(index, "percentage", e.target.value)
//             }
//             className="w-20 border p-2 rounded"
//           />
//           {index === crops.length - 1 && (
//             <button
//               type="button"
//               onClick={addCropField}
//               className="px-3 bg-green-500 text-white rounded"
//             >
//               +
//             </button>
//           )}
//           {crops.length > 1 && (
//             <button
//               type="button"
//               onClick={() => removeCropField(index)}
//               className="px-3 bg-red-500 text-white rounded"
//             >
//               −
//             </button>
//           )}
//         </div>
//       ))}

//       <hr className="my-6" />

//       <h3 className="font-medium mb-2">Landholding Category (%)</h3>
//       <div className="grid grid-cols-3 gap-4">
//         {["small", "medium", "large"].map((type) => (
//           <div key={type}>
//             <label className="block text-sm font-medium mb-1 capitalize">
//               {type}
//             </label>
//             <input
//               type="number"
//               value={landSizePercentages[type]}
//               onChange={(e) =>
//                 setLandSizePercentages((prev) => ({
//                   ...prev,
//                   [type]: e.target.value,
//                 }))
//               }
//               className="w-full border p-2 rounded"
//             />
//           </div>
//         ))}
//       </div>

//       <hr className="my-6" />

//       <h3 className="font-medium mb-2">Product Use (%)</h3>
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {["pesticide", "fertilizer", "pgr", "biosimulant"].map((prod) => (
//           <div key={prod}>
//             <label className="block text-sm font-medium mb-1 capitalize">
//               {prod}
//             </label>
//             <input
//               type="number"
//               value={productUsePercentages[prod]}
//               onChange={(e) =>
//                 setProductUsePercentages((prev) => ({
//                   ...prev,
//                   [prod]: e.target.value,
//                 }))
//               }
//               className="w-full border p-2 rounded"
//             />
//           </div>
//         ))}
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Preferred Starting Serial Number
//         </label>
//         <input
//           type="text"
//           value={preferredSerialNo}
//           onChange={(e) => {
//             const value = e.target.value
//               .replace(/[^a-zA-Z0-9]/g, "")
//               .slice(0, 20);
//             setPreferredSerialNo(value);
//           }}
//           placeholder="ex. SR12341"
//           className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//           required
//           maxLength={20}
//         />
//         <p className="text-xs text-gray-500 mt-1">
//           This will be the starting number for generated invoices (max 20
//           alphanumeric characters)
//         </p>
//         {preferredSerialNo.length >= 10 && (
//           <p className="text-xs text-red-500 mt-1">
//             Maximum length reached (10 characters)
//           </p>
//         )}
//       </div>

//       <div className="mt-6">
//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//         >
//           {isLoading ? "Generating..." : "Generate Dispatch Plan"}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default BudgetSection;

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
} from "react-icons/fi";

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

const BudgetSection = ({ fileId, onGenerate }) => {
  const [formData, setFormData] = useState({
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
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        numberOfFarmers: parseInt(formData.recipientsCount),
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">
              Farmer Targeting Configuration
            </h1>
            <p className="text-blue-100 mt-1">
              Configure parameters for farmer selection and dispatch generation
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-red-500 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FiMapPin className="mr-2 text-blue-600" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Total Budget (₹)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        min={10000}
                        max={10000000}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Rate per Acre (₹)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min={100}
                        max={1000}
                        required
                      />
                    </div>
                  </div>

                  {/* District */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      District
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

                  {/* Number of Farmers */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Farmers
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="recipientsCount"
                        value={formData.recipientsCount}
                        onChange={handleChange}
                        className="block w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter number"
                        required
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="block w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="block w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Crop Configuration Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Crop Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.crops.map((crop, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="space-y-3">
                        {/* Crop Name */}
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

                        {/* Percentage */}
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
                              className="block w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0-100"
                              min="0"
                              max="100"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <FiPercent className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Add/Remove Buttons */}
                        <div className="flex justify-between pt-1">
                          {index === formData.crops.length - 1 && (
                            <button
                              type="button"
                              onClick={addCropField}
                              className="text-xs inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <FiPlus className="h-3 w-3 mr-1" /> Add
                            </button>
                          )}
                          {formData.crops.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCropField(index)}
                              className="text-xs inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

              {/* Landholding and Product Use Sections */}
              <div className="space-y-6">
                {/* Landholding Category */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Landholding Categories (%)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { key: "small", label: "Small (0-2 acres)" },
                      { key: "medium", label: "Medium (3-10 acres)" },
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
                            className="block w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0-100"
                            min="0"
                            max="100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <FiPercent className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Use */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Product Usage (%)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            className="block w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0-100"
                            min="0"
                            max="100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <FiPercent className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Serial Number */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Invoice Settings
                </h2>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Starting Serial Number
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiHash className="h-5 w-5 text-gray-400" />
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
                      className="block w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., SR10001"
                      required
                      maxLength={20}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    This will be the starting number for generated invoices
                    (alphanumeric, max 20 chars)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
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
                      Generating...
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
