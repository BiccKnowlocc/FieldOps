export type GridCell = { x: number; y: number; existingFt: number; designFt: number };

export function demoGrid(): GridCell[] {
  const cells: GridCell[] = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 10; x += 1) {
      const existingFt = 12 + Math.sin(x / 2) * 1.4 + Math.cos(y / 2) * 0.8 + (x > 6 ? 2.2 : 0);
      const designFt = 12.5;
      cells.push({ x, y, existingFt, designFt });
    }
  }
  return cells;
}

export function volumeFromCells(cells: GridCell[], cellSf = 400) {
  let cutCf = 0;
  let fillCf = 0;
  for (const cell of cells) {
    const delta = cell.existingFt - cell.designFt;
    const cf = Math.abs(delta) * cellSf;
    if (delta > 0.05) cutCf += cf;
    else if (delta < -0.05) fillCf += cf;
  }
  const cutCy = cutCf / 27;
  const fillCy = fillCf / 27;
  return { cutCy, fillCy, netCy: fillCy - cutCy };
}

export function cellTone(cell: GridCell) {
  const delta = cell.existingFt - cell.designFt;
  if (delta > 0.4) return 'cut';
  if (delta < -0.4) return 'fill';
  return 'ok';
}
