const { distributeAcres } = require('./helpFunctions');

// Global counter for unique invoice numbers
let invoiceCounter = 1;

// Function to generate unique invoice numbers in INV-XXXXX-XX format
const generateUniqueInvoiceNumber = () => {
    const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5 digit number
    const serialNum = invoiceCounter.toString().padStart(2, '0'); // 2 digit serial

    invoiceCounter++;

    // Format: INV-XXXXX-XX (e.g., INV-24524-01)
    return `INV-${randomNum}-${serialNum}`;
};

const getProcessedData = (farmersByRegion, regions, recipientsCount, distributedAcres, acresDivision, prefix, currentNumber, discountAmount) => {
    const processedData = [];
    let totalDiscountedFarmers = 0;

    Object.entries(farmersByRegion).forEach(([regionId, farmers]) => {  // farmersByRegion, regions, recipientsCount, acresDivision, prefix, currentNumber, discountAmount
        const region = regions[regionId];
        const discountedIndices = new Set();
        const discountCount = Math.min(recipientsCount, farmers.length);
        totalDiscountedFarmers += discountCount;

        while (discountedIndices.size < discountCount) {
            const randomIndex = Math.floor(Math.random() * farmers.length);
            discountedIndices.add(randomIndex);
        }

        // Get acres for this region from acresDivision (0-based index)
        const regionIndex = parseInt(regionId) - 1;
        const totalRegionAcres = acresDivision[regionIndex] || 0;
        const distributedAcres = distributeAcres(farmers.length, totalRegionAcres);

        farmers.forEach((farmer, index) => {
            const isDiscounted = discountedIndices.has(index);
            const acres = distributedAcres[index];
            const originalAmount = (acres * region.ratePerAcre).toFixed(2);
            const finalAmount = isDiscounted
                ? (originalAmount - discountAmount).toFixed(2)
                : originalAmount;

            processedData.push({
                serialNo: `${prefix}${currentNumber++}`,
                farmerName: farmer.name || "",
                farmerMobile: farmer.farmerMobile || "",
                address: farmer.address || "unknown",
                city: farmer.city || "",
                district: farmer.district,
                state: farmer.state || "",
                pincode: farmer.pincode || "",
                cropType: farmer.cropType || "No Crop",
                cropSpray: farmer.cropSpray || "unknown",
                acres,
                region: region.name,
                regionId: parseInt(regionId),
                ratePerAcre: region.ratePerAcre,
                originalAmount,
                discount: isDiscounted ? `₹${discountAmount}` : 'No',
                finalAmount,
                invoiceNo: generateUniqueInvoiceNumber()
            });
        });
    });

    return { processedData, totalDiscountedFarmers };
}

const divideBySet = (processedData) => {

    const sets = {
        unknownData: [],
        halfData: [],
        noCropData: [],
        incompleteData: [],
        fullData: []
    }

    if (processedData.length > 0) {
        processedData.forEach((data) => {
            if (data.address === "unknown") {
                sets.unknownData.push(data);
            } else if (data.acres < 0.1) {
                sets.halfData.push(data);
            } else if (data.cropType === "No Crop") {
                sets.noCropData.push(data);
            } else if (data.state === '') {
                sets.incompleteData.push(data);
            } else {
                sets.fullData.push(data);
            }
        });
    }

   

    return sets;
}



module.exports = { getProcessedData, divideBySet };