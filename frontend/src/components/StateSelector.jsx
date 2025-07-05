import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";

const StateSelector = ({ stateValue, onStateValue }) => {
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          "https://api.countrystatecity.in/v1/countries/IN/states",
          {
            headers: {
              "X-CSCAPI-KEY": import.meta.env.VITE_API_KEY,
            },
          }
        );

        setStates(res.data);
      } catch (error) {
        console.error("Failed to fetch states", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStates();
  }, []);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select State
      </label>
      <Select
        options={states.map((state) => ({
          value: state.name,
          label: state.name,
        }))}
        value={stateValue ? { value: stateValue, label: stateValue } : null}
        onChange={(option) => onStateValue(option ? option.value : "")}
        disabled={isLoading}
        placeholder="Type or select state..."
        isClearable
      />
    </div>
  );
};

export default StateSelector;
