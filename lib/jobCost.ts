import { COST_CODES, LABOR_RATE } from './catalog';
import type { ChangeOrder, DailyLog, EstimateLine, PurchaseOrder, Receipt } from './types';

export function lineAmount(qty: number, unitCost: number) {
  return Math.round(qty * unitCost * 100) / 100;
}

export function changeOrderAmount(order: ChangeOrder) {
  const material = order.lines.reduce((sum, line) => sum + lineAmount(line.qty, line.unitCost), 0);
  return material + lineAmount(order.laborHours, order.laborRate);
}

export function laborHoursFromLogs(logs: DailyLog[]) {
  return logs.reduce((sum, log) => sum + log.crewIds.length * 8, 0);
}

export function jobCost(input: {
  estimateLines: EstimateLine[];
  changeOrders: ChangeOrder[];
  receipts: Receipt[];
  purchaseOrders: PurchaseOrder[];
  logs: DailyLog[];
}) {
  const estimateTotal = input.estimateLines
    .filter((line) => line.source === 'estimate')
    .reduce((sum, line) => sum + lineAmount(line.qty, line.unitCost), 0);
  const signedCos = input.changeOrders.filter((order) => order.status === 'signed');
  const coTotal = signedCos.reduce((sum, order) => sum + changeOrderAmount(order), 0);
  const contract = estimateTotal + coTotal;
  const receiptTotal = input.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const poCommitted = input.purchaseOrders
    .filter((po) => po.status === 'issued')
    .reduce((sum, po) => sum + lineAmount(po.qty, po.unitCost), 0);
  const laborHours = laborHoursFromLogs(input.logs);
  const laborActual = lineAmount(laborHours, LABOR_RATE);
  const actual = receiptTotal + laborActual;
  const committed = actual + poCommitted;
  const ctc = Math.max(0, contract - committed);
  const variance = contract - committed;

  const codes = COST_CODES.map((code) => {
    const budget = input.estimateLines
      .filter((line) => line.costCode === code.code && line.source === 'estimate')
      .reduce((sum, line) => sum + lineAmount(line.qty, line.unitCost), 0);
    const receiptActual = input.receipts
      .filter((receipt) => receipt.costCode === code.code)
      .reduce((sum, receipt) => sum + receipt.amount, 0);
    const actualForCode = code.code === '01-000' ? laborActual + receiptActual : receiptActual;
    return {
      code: code.code,
      name: code.name,
      budget,
      actual: actualForCode,
      remaining: budget - actualForCode,
    };
  });

  return { estimateTotal, coTotal, contract, receiptTotal, laborHours, laborActual, actual, committed, ctc, variance, codes };
}
