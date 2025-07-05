import React, { useState, useEffect } from "react";

{
  filteredData.length > 0 && (
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
  );
}
