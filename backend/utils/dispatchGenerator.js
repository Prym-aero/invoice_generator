async function generateDispatchData({
    farmers,
    pilots,
    totalBudget,
    rate,
    district,
    crops,
    landSizePercentages,
    productUsePercentages,
    dateRange,
    startSerial,
}) {
    const totalAcres = totalBudget / rate;

    const normalize = (str) => {
        if (typeof str !== "string") return "";
        return str.trim().toLowerCase();
    };

    // Step 1: Normalize district
    const normalizedDistrict = normalize(district);

    // Step 2: Find a sample taluka from the same district
    const referenceFarmer = farmers.find(f =>
        normalize(f.district) === normalizedDistrict &&
        typeof f.taluka === 'string' &&
        f.taluka.trim() !== ""
    );

    const fallbackTaluka = referenceFarmer?.taluka || 'Default Taluka';

    // Step 3: Fill missing talukas
    farmers = farmers.map(farmer => {
        let updatedFarmer = { ...farmer };

        // Assign taluka if missing
        if (!farmer.taluka || typeof farmer.taluka !== 'string' || farmer.taluka.trim() === "") {
            updatedFarmer.taluka = fallbackTaluka;
        }

        // Optionally fix 0-acre farmers too here (optional)
        if (!farmer.acres || farmer.acres === 0) {
            updatedFarmer.acres = Math.floor(Math.random() * 6) + 5;
        }

        return updatedFarmer;
    });



    let eligibleFarmers = farmers.filter(
        (f) => normalize(f.district) === normalize(district)
    );

    if (eligibleFarmers.length === 0) {
        console.warn(`No farmers found for district: ${district}`);
    }

    const landTypes = {
        small: eligibleFarmers.filter(f => f.acres >= 0 && f.acres <= 2),
        medium: eligibleFarmers.filter(f => f.acres >= 3 && f.acres <= 10),
        large: eligibleFarmers.filter(f => f.acres > 10),
    };

    const selectedFarmers = [];
    let totalSelectedAcres = 0;

    const targetCounts = {
        small: Math.round((eligibleFarmers.length * landSizePercentages.small) / 100),
        medium: Math.round((eligibleFarmers.length * landSizePercentages.medium) / 100),
        large: Math.round((eligibleFarmers.length * landSizePercentages.large) / 100),
    };

    for (const [category, count] of Object.entries(targetCounts)) {
        const candidates = [...landTypes[category]].sort(() => 0.5 - Math.random());

        for (const farmer of candidates) {
            const farmerTotalCost = farmer.acres * rate;
            if (
                totalSelectedAcres + farmer.acres <= totalAcres &&
                getTotalCost(selectedFarmers) + farmerTotalCost <= totalBudget
            ) {
                selectedFarmers.push({
                    ...farmer,
                    perRate: rate,
                    totalCost: farmerTotalCost,
                });
                totalSelectedAcres += farmer.acres;
            }
        }
    }

    const remainingCandidates = eligibleFarmers.filter(
        (f) => !selectedFarmers.find(sf => sf.mobile === f.mobile)
    ).sort(() => 0.5 - Math.random());

    for (const farmer of remainingCandidates) {
        const farmerTotalCost = farmer.acres * rate;
        if (
            totalSelectedAcres + farmer.acres <= totalAcres &&
            getTotalCost(selectedFarmers) + farmerTotalCost <= totalBudget
        ) {
            selectedFarmers.push({
                ...farmer,
                perRate: rate,
                totalCost: farmerTotalCost,
            });
            totalSelectedAcres += farmer.acres;
        }
    }

    function addExtraFarmersToFulfillTargets(eligibleFarmers, selectedFarmers, totalAcres, totalBudget, rate) {
        const extraCandidates = [...eligibleFarmers];

        if (extraCandidates.length === 0) {
            console.warn('No eligible farmers available for extra addition.');
            return;
        }

        let totalSelectedAcres = selectedFarmers.reduce((sum, f) => sum + f.acres, 0);
        let totalCost = getTotalCost(selectedFarmers);

        let idx = 0;

        while (
            totalSelectedAcres < totalAcres &&
            totalCost < totalBudget &&
            selectedFarmers.length < 500 // <- prevent bloating
        ) {
            const farmer = extraCandidates[idx % extraCandidates.length];
            const farmerTotalCost = farmer.acres * rate;

            if (totalSelectedAcres + farmer.acres <= totalAcres &&
                totalCost + farmerTotalCost <= totalBudget) {
                selectedFarmers.push({
                    ...farmer,
                    perRate: rate,
                    totalCost: farmerTotalCost,
                });

                totalSelectedAcres += farmer.acres;
                totalCost += farmerTotalCost;
            }

            idx++;
            if (idx > extraCandidates.length * 50) break; // safety break
        }

    }


    // Call helper function here to add extra farmers if needed
    addExtraFarmersToFulfillTargets(eligibleFarmers, selectedFarmers, totalAcres, totalBudget, rate);

    assignCrops(selectedFarmers, crops);
    assignProductUsage(selectedFarmers, productUsePercentages);
    assignPilots(selectedFarmers, pilots);
    assignDates(selectedFarmers, dateRange);
    assignSerialNumbers(selectedFarmers, startSerial);
    assignInvoiceNumbers(selectedFarmers);

    return selectedFarmers;
}





function getTotalCost(farmers) {
    return farmers.reduce((sum, f) => sum + (f.totalCost || 0), 0);
}


function pickRandom(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

function assignCrops(farmers, crops) {
    const total = farmers.length;
    let assigned = 0;

    crops.forEach(({ name, percentage }, index) => {
        const cropCount = Math.round((percentage / 100) * total);
        const slice = farmers.slice(assigned, assigned + cropCount);
        slice.forEach((f) => (f.crop = name));
        assigned += cropCount;
    });

    // Fill remaining
    farmers.slice(assigned).forEach((f) => (f.crop = crops[0]?.name || "Unknown"));
}

function assignSerialNumbers(farmers, startSerial) {
    // Extract prefix (letters) and number part
    const match = startSerial.match(/^([A-Za-z]*)(\d+)$/);
    const prefix = match ? match[1] : "";
    let number = match ? parseInt(match[2]) : 1;

    farmers.forEach((f) => {
        f.serialNumber = `${prefix}${number++}`;
    });
}

// Global counter for unique invoice numbers
let invoiceCounter = 1;

function assignInvoiceNumbers(farmers) {
    farmers.forEach((f) => {
        const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5 digit number
        const serialNum = invoiceCounter.toString().padStart(2, '0'); // 2 digit serial
        f.invoiceNo = `INV-${randomNum}-${serialNum}`;
        invoiceCounter++;
    });
}


function assignProductUsage(farmers, productPercentages) {
    const productKeys = Object.keys(productPercentages);
    const totalFarmers = farmers.length;
    const assignedFarmers = new Set();

    Object.entries(productPercentages).forEach(([product, percentage]) => {
        const count = Math.round((percentage / 100) * totalFarmers);
        const selectedFarmers = pickRandom(farmers.filter(f => !assignedFarmers.has(f)), count);

        selectedFarmers.forEach(f => {
            if (!Array.isArray(f.used_medicine)) f.used_medicine = [];
            f.used_medicine.push(product);
            assignedFarmers.add(f);
        });
    });

    // Fill missing
    farmers.forEach(farmer => {
        if (!Array.isArray(farmer.used_medicine) || farmer.used_medicine.length === 0) {
            const randomProduct = productKeys[Math.floor(Math.random() * productKeys.length)];
            farmer.used_medicine = []; // ✅ FIX: Initialize before push
            farmer.used_medicine.push(randomProduct);
        }
    });
}





function normalize(str) {
    return str?.toLowerCase().replace(/\s+/g, "").trim();
}

function assignPilots(farmers, pilots) {
    farmers.forEach(f => {
        const farmerTaluka = normalize(f.taluka);
        const farmerDistrict = normalize(f.district);

        // Try to find pilots assigned to the same taluka
        let availablePilots = pilots.filter(p =>
            p.assignedTalukas?.some(t => normalize(t) === farmerTaluka)
        );

        // If none found in taluka, fallback to pilots from the same district
        if (availablePilots.length === 0) {
            availablePilots = pilots.filter(p =>
                normalize(p.district) === farmerDistrict
            );
        }

        // Final fallback if still none found
        if (availablePilots.length === 0) {
            console.warn(`❌ No pilot found for farmer '${f.name}' in taluka '${f.taluka}' or district '${f.district}'`);
        }

        f.assignedPilot = availablePilots.length
            ? availablePilots[Math.floor(Math.random() * availablePilots.length)].name
            : "Unassigned";
    });
}


function assignDates(farmers, { start, end }) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const daysDiff = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));

    farmers.forEach((f, i) => {
        const sprayDay = new Date(startDate);
        sprayDay.setDate(startDate.getDate() + (i % daysDiff));
        f.scheduledDate = sprayDay.toISOString().split("T")[0];
    });
}

module.exports = { generateDispatchData };
