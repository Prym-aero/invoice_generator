// FarmerAnalytics.jsx
import React, { useState } from 'react';
import axios from 'axios';

const FarmerAnalytics = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({ farmers: null, pilots: null });
  const [metadata, setMetadata] = useState(null);
  const [filters, setFilters] = useState({
    district: '',
    totalFarmers: 100,
    crops: [{ name: '', percentage: 0, rate: 0 }],
    categories: { small: 0, medium: 0, large: 0 },
    dateRange: { start: '', end: '' }
  });
  const [report, setReport] = useState(null);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('farmersFile', files.farmers);
    formData.append('pilotsFile', files.pilots);

    try {
      const res = await axios.post('/api/upload', formData);
      setMetadata(res.data);
      setStep(2);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleCropChange = (index, field, value) => {
    const newCrops = [...filters.crops];
    newCrops[index][field] = field === 'percentage' || field === 'rate' ? Number(value) : value;
    setFilters({ ...filters, crops: newCrops });
  };

  const addCrop = () => {
    setFilters({
      ...filters,
      crops: [...filters.crops, { name: '', percentage: 0, rate: 0 }]
    });
  };

  const removeCrop = (index) => {
    const newCrops = [...filters.crops];
    newCrops.splice(index, 1);
    setFilters({ ...filters, crops: newCrops });
  };

  const generateReport = async () => {
    try {
      const res = await axios.post('/api/generate-report', {
        filters,
        farmersPath: files.farmers.path,
        pilotsPath: files.pilots.path
      });
      setReport(res.data);
      setStep(3);
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  return (
    <div className="container">
      {step === 1 && (
        <div className="file-upload-section">
          <h2>Upload Data Files</h2>
          <form onSubmit={handleFileUpload}>
            <div className="file-input">
              <label>Farmers Data (Excel)</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFiles({...files, farmers: e.target.files[0]})}
                required
              />
            </div>
            <div className="file-input">
              <label>Pilots Data (Excel)</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFiles({...files, pilots: e.target.files[0]})}
                required
              />
            </div>
            <button type="submit">Process Files</button>
          </form>
        </div>
      )}

      {step === 2 && metadata && (
        <div className="filter-section">
          <h2>Configure Farmer Selection</h2>
          
          <div className="form-group">
            <label>District</label>
            <select
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
              required
            >
              <option value="">Select District</option>
              {metadata.districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Number of Farmers</label>
            <input
              type="number"
              min="1"
              max={metadata.stats.totalFarmers}
              value={filters.totalFarmers}
              onChange={(e) => setFilters({...filters, totalFarmers: e.target.value})}
              required
            />
          </div>

          <div className="crops-section">
            <h3>Crop Selection</h3>
            {filters.crops.map((crop, index) => (
              <div key={index} className="crop-input-group">
                <select
                  value={crop.name}
                  onChange={(e) => handleCropChange(index, 'name', e.target.value)}
                  required
                >
                  <option value="">Select Crop</option>
                  {metadata.crops.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Percentage"
                  value={crop.percentage}
                  onChange={(e) => handleCropChange(index, 'percentage', e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Rate per acre"
                  value={crop.rate}
                  onChange={(e) => handleCropChange(index, 'rate', e.target.value)}
                  required
                />
                {filters.crops.length > 1 && (
                  <button type="button" onClick={() => removeCrop(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addCrop}>
              + Add Another Crop
            </button>
          </div>

          <div className="category-section">
            <h3>Farmer Category Distribution</h3>
            <div>
              <label>Small (0-2 acres)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.categories.small}
                onChange={(e) => setFilters({
                  ...filters,
                  categories: {...filters.categories, small: e.target.value}
                })}
                required
              />%
            </div>
            {/* Repeat for medium and large */}
          </div>

          <div className="date-section">
            <h3>Completion Date Range</h3>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: {...filters.dateRange, start: e.target.value}
              })}
              required
            />
            <span>to</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: {...filters.dateRange, end: e.target.value}
              })}
              required
            />
          </div>

          <button onClick={generateReport}>Generate Report</button>
        </div>
      )}

      {step === 3 && report && (
        <div className="report-section">
          <h2>Farmer Analytics Report</h2>
          
          <div className="report-actions">
            <a href={report.reportUrl} download className="download-btn">
              Download Excel Report
            </a>
          </div>

          <div className="summary-section">
            <h3>Summary Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Farmers</h4>
                <p>{report.stats.total}</p>
              </div>
              {report.stats.byCrop.map(crop => (
                <div key={crop.name} className="stat-card">
                  <h4>{crop.name} Farmers</h4>
                  <p>{crop.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="data-table">
            <h3>Farmer Details</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Taluka</th>
                  <th>Crops</th>
                  <th>Land (acres)</th>
                  <th>Category</th>
                  <th>Pilot</th>
                  <th>Rate/Acre</th>
                  <th>Est. Cost</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {report.data.map((farmer, index) => (
                  <tr key={index}>
                    <td>{farmer.id}</td>
                    <td>{farmer.name}</td>
                    <td>{farmer.taluka}</td>
                    <td>{farmer.crops}</td>
                    <td>{farmer.landArea}</td>
                    <td>
                      {farmer.landArea <= 2 ? 'Small' : 
                       farmer.landArea <= 10 ? 'Medium' : 'Large'}
                    </td>
                    <td>{farmer.pilotName}</td>
                    <td>₹{farmer.ratePerAcre}</td>
                    <td>₹{farmer.estimatedCost}</td>
                    <td>{new Date(farmer.completionDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerAnalytics;