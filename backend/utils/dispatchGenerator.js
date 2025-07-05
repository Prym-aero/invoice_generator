function generateDispatchData({
    farmers,
    pilots,
    totalBudget,
    rate,
    district,
    numberOfFarmers,
    crops,
    landSizePercentages,
    productUsePercentages,
    dateRange,
    startSerial,
}) {
    const totalAcres = totalBudget / rate;

    // 1. Filter farmers by district
    let eligibleFarmers = farmers.filter(
        (f) => f.district?.toLowerCase() === district.toLowerCase()
    );

    // 2. Filter by land size category
    const landTypes = {
        small: eligibleFarmers.filter(f => f.acres >= 0 && f.acres <= 2),
        medium: eligibleFarmers.filter(f => f.acres >= 3 && f.acres <= 10),
        large: eligibleFarmers.filter(f => f.acres > 10),
    };

    const total = numberOfFarmers;
    const selected = [
        ...pickRandom(landTypes.small, (total * landSizePercentages.small) / 100),
        ...pickRandom(landTypes.medium, (total * landSizePercentages.medium) / 100),
        ...pickRandom(landTypes.large, (total * landSizePercentages.large) / 100),
    ];

    // 3. Assign crop by %
    assignCrops(selected, crops);

    // 4. Assign products by %
    assignProductUsage(selected, productUsePercentages);

    // 5. Assign pilot by taluka
    assignPilots(selected, pilots);

    // 6. Assign spraying date range
    assignDates(selected, dateRange);

    // 7. Assign Serial number
    assignSerialNumbers(selected, startSerial);

    return selected;
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


function assignProductUsage(farmers, productPercentages) {
    Object.entries(productPercentages).forEach(([product, percentage]) => {
        const count = Math.round((percentage / 100) * farmers.length);
        pickRandom(farmers, count).forEach((f) => (f[`${product}_use`] = true));
    });
}

function normalize(str) {
    return str?.toLowerCase().replace(/\s+/g, "").trim();
}

function assignPilots(farmers, pilots) {
    farmers.forEach(f => {
        const farmerTaluka = normalize(f.taluka);

        const availablePilots = pilots.filter(p =>
            p.assignedTalukas?.some(t => normalize(t) === farmerTaluka)
        );

        if (!availablePilots.length) {
            console.warn(`❌ No pilot found for farmer '${f.name}' in taluka '${f.taluka}'`);
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
