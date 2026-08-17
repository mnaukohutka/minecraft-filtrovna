const FILTERS = new Map();

function keyOf(block) {
  return [
    block.dimension.id,
    block.location.x,
    block.location.y,
    block.location.z
  ].join("|");
}

export function registerFilter(block) {
  FILTERS.set(keyOf(block), {
    dimensionId: block.dimension.id,
    location: {
      x: block.location.x,
      y: block.location.y,
      z: block.location.z
    }
  });
}

export function unregisterFilter(block) {
  FILTERS.delete(keyOf(block));
}

export function getRegisteredFilters(dimension) {
  const result = [];

  for (const record of FILTERS.values()) {
    if (record.dimensionId !== dimension.id) {
      continue;
    }

    const block = dimension.getBlock(record.location);

    if (block?.typeId === "filtrovna:filtr") {
      result.push(block);
    }
  }

  return result;
}
