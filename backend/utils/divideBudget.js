function divideBudget(total) {
  let parts = [];
  let remaining = total;

  for (let i = 0; i < 4; i++) {
    let part = Math.floor(Math.random() * (remaining - (4 - i))) + 1;
    parts.push(part);
    remaining -= part;
  }
  parts.push(remaining);

  // Ensure all values are unique and non-zero
  const unique = new Set(parts);
  if (unique.size !== 5 || parts.includes(0)) return divideBudget(total);

  return parts;
}

module.exports = divideBudget;
