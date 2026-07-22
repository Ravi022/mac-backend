import crypto from "crypto";
import ExcelJS from "exceljs";
import { normalizeMacId } from "../utils/mac.js";

export function computeGenerationResults(gen) {
  if (gen.itemType === "ONT") {
    const startMacId = normalizeMacId(gen.startMacId);
    const {
      requiredPerDevice,
      startHwSnPrefix,
      startHwSnSuffix = "",
      startPonSnPrefix,
      macIdRequired,
    } = gen;

    const missing = [];
    if (!startMacId) missing.push("startMacId");
    if (requiredPerDevice == null) missing.push("requiredPerDevice");
    if (!startHwSnPrefix) missing.push("startHwSnPrefix");
    if (startHwSnSuffix == null) missing.push("startHwSnSuffix");
    if (!startPonSnPrefix) missing.push("startPonSnPrefix");
    if (missing.length) {
      const error = new Error(
        "Missing generation parameters: " + missing.join(", ")
      );
      error.statusCode = 400;
      throw error;
    }

    const numDevices = gen.itemQuantity;
    const baseMacInt = BigInt("0x" + startMacId);
    const macWidth = startMacId.length;
    const hwStart = parseInt(startHwSnSuffix, 10) || 0;
    const hwPadLen = startHwSnSuffix.length;
    const results = [];

    for (let deviceIdx = 0; deviceIdx < numDevices; deviceIdx++) {
      const macOffset = BigInt(requiredPerDevice) * BigInt(deviceIdx);
      const thisMacInt = baseMacInt + macOffset;
      const macHex = thisMacInt
        .toString(16)
        .toUpperCase()
        .padStart(macWidth, "0");
      const ponSn = startPonSnPrefix + macHex.slice(-8);
      const hwSeq = hwStart + deviceIdx;
      const hwSuffix = String(hwSeq).padStart(hwPadLen, "0");
      const hwSn = startHwSnPrefix + hwSuffix;
      const row = { macId: macHex, ponSn, hwSn };
      if (macIdRequired) {
        row.macKey = crypto
          .createHash("md5")
          .update(macHex, "utf8")
          .digest("hex");
      }
      results.push(row);
    }

    return results;
  }

  if (gen.itemType === "SWITCH") {
    const startMacId = normalizeMacId(gen.startMacId);
    const {
      requiredPerDevice,
      itemQuantity,
      startHwSnPrefix,
      startHwSnSuffix = "",
    } = gen;

    const missing = [];
    if (!startMacId) missing.push("startMacId");
    if (requiredPerDevice == null) missing.push("requiredPerDevice");
    if (itemQuantity == null) missing.push("itemQuantity");
    if (!startHwSnPrefix) missing.push("startHwSnPrefix");
    if (startHwSnSuffix == null) missing.push("startHwSnSuffix");
    if (missing.length) {
      const error = new Error("Missing required fields: " + missing.join(", "));
      error.statusCode = 400;
      throw error;
    }

    const baseMacInt = BigInt("0x" + startMacId);
    const macWidth = startMacId.length;
    const hwStart = parseInt(startHwSnSuffix, 10) || 0;
    const padLen = startHwSnSuffix.length;
    const results = [];

    for (let deviceIdx = 0; deviceIdx < itemQuantity; deviceIdx++) {
      const offset = BigInt(requiredPerDevice) * BigInt(deviceIdx);
      const thisMacInt = baseMacInt + offset;
      const macHex = thisMacInt
        .toString(16)
        .toUpperCase()
        .padStart(macWidth, "0");
      const hwSeq = hwStart + deviceIdx;
      const suffix = String(hwSeq).padStart(padLen, "0");
      const hwSn = startHwSnPrefix + suffix;
      results.push({ macId: macHex, hwSn });
    }

    return results;
  }

  const error = new Error(`Unsupported itemType: ${gen.itemType}`);
  error.statusCode = 400;
  throw error;
}

export async function buildResultsWorkbook(results) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");

  if (!results.length) {
    sheet.addRow(["No data"]);
    return workbook;
  }

  const headers = Object.keys(results[0]);
  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 2, 16),
  }));
  sheet.addRows(results);
  sheet.getRow(1).font = { bold: true };
  return workbook;
}

export function buildWorkOrderSummaryRows(gen) {
  return [
    { field: "Work Order Number", value: gen.workOrderNumber || "" },
    { field: "Customer Name", value: gen.customerName || "" },
    { field: "Customer PO", value: gen.customerPo || "" },
    {
      field: "Customer PO Date",
      value: gen.customerPoDate
        ? new Date(gen.customerPoDate).toISOString().slice(0, 10)
        : "",
    },
    { field: "Item Type", value: gen.itemType || "" },
    { field: "Customer Model", value: gen.customerModel || "" },
    { field: "OEM Model", value: gen.oemModel || "" },
    { field: "ODM Model", value: gen.odmModel || "" },
    { field: "Item Quantity", value: gen.itemQuantity ?? "" },
    { field: "Generation Status", value: gen.excelFileGenerated ? "Generated" : "Not generated" },
    { field: "Start MAC ID", value: gen.startMacId || "" },
    { field: "Required Per Device", value: gen.requiredPerDevice ?? "" },
    { field: "HW SN Prefix", value: gen.startHwSnPrefix || "" },
    { field: "HW SN Suffix", value: gen.startHwSnSuffix || "" },
    { field: "PON SN Prefix", value: gen.startPonSnPrefix || "" },
    { field: "MAC Vendor", value: gen.macVendorName || "" },
    { field: "Created At", value: gen.createdAt ? new Date(gen.createdAt).toISOString() : "" },
  ];
}

export async function buildSummaryWorkbook(gen) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Work Order Info");
  sheet.columns = [
    { header: "Field", key: "field", width: 24 },
    { header: "Value", key: "value", width: 40 },
  ];
  sheet.addRows(buildWorkOrderSummaryRows(gen));
  sheet.getRow(1).font = { bold: true };
  return workbook;
}
