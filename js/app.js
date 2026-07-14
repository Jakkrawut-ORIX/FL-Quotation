/**
 * storage.js — Storage Management
 * บริหารจัดการการบันทึก/โหลด configuration
 */

export class StorageManager {
  constructor(storageKey = 'lease-calculator-v3') {
    this.key = storageKey;
  }

  /**
   * บันทึก data ลง localStorage
   */
  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  }

  /**
   * โหลด data จาก localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage load failed:', e);
      return null;
    }
  }

  /**
   * ลบ data ออก
   */
  clear() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (e) {
      console.warn('Storage clear failed:', e);
      return false;
    }
  }

  /**
   * Export เป็น JSON file
   */
  exportToFile(data, filename = 'lease-config.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /**
   * Import จาก JSON file
   */
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (err) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsText(file);
    });
  }
}

/**
 * app.js — Application Orchestrator
 * ผูกโมดูลต่างๆ เข้าด้วยกัน
 */

import { DEFAULT_VALUES } from './config.js';
import { $, setVal, showToast, setupNumericFormatting } from './utils.js';
import { Calculator } from './calculator.js';
import { UIManager } from './ui-manager.js';

export class App {
  constructor() {
    this.calculator = new Calculator({});
    this.ui = new UIManager(this.calculator, null);
    this.storage = new StorageManager();
    
    // Bind methods
    this.onRecalc = this.onRecalc.bind(this);
    this.print = this.print.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.resetAll = this.resetAll.bind(this);
    this.solveFlatFromIRR = this.solveFlatFromIRR.bind(this);
    this.goalSeekDown = this.goalSeekDown.bind(this);
  }

  /**
   * Initialize app
   */
  init() {
    // 1. Load saved data หรือใช้ defaults
    const saved = this.storage.load();
    const initialData = saved || DEFAULT_VALUES;
    this.loadValues(initialData);

    // 2. Setup numeric formatting
    setupNumericFormatting();

    // 3. Setup UI event listeners
    this.ui.onRecalc(this.onRecalc);
    this.ui.setupEventListeners();

    // 4. Initial calculation
    this.recalculate();

  // 5. Expose public methods to window
window.app = this;

window.exportExcel = () => this.exportExcel();
window.resetAll = () => this.resetAll();
window.printQuotation = () => this.print();

window.onGuarNone = (cb) => {
  if (this.ui.onGuarNone) {
    this.ui.onGuarNone(cb);
  } else {
    this.recalculate();
  }
};

window.onGuarCheck = (cb) => {
  if (this.ui.onGuarCheck) {
    this.ui.onGuarCheck(cb);
  } else {
    this.recalculate();
  }
};

  /**
   * โหลดค่าไปยัง inputs
   */
  loadValues(data) {
    Object.entries(data).forEach(([key, value]) => {
      setVal(key, value);
    });
  }

  /**
   * Callback: เรียกเมื่อ UI เปลี่ยน
   */
  onRecalc(action = null) {
    if (action === 'solveIRR') {
      this.solveFlatFromIRR();
    } else if (action === 'goalSeek') {
      this.goalSeekDown();
    } else {
      this.recalculate();
    }
  }

  /**
   * Main recalculation flow
   */
  recalculate() {
    try {
      // 1. Read inputs
      const inputs = this.ui.readInputs();
      
      // 2. Update calculator
      this.calculator.inputs = inputs;

      // 3. Calculate
      const results = this.calculator.getResults();

      // 4. Update UI
      this.ui.updateHeroPayment(results);
      this.ui.updateResults(results);
      this.ui.updateWorksheet(results);
      this.ui.updateQuotation(results);
      this.ui.updateWarnings(results.warnings);

      // 5. Auto-save
      this.storage.save(inputs);
    } catch (error) {
      console.error('Calculation error:', error);
      this.ui.showError('❌ ' + error.message);
    }
  }

  /**
   * Solve: Flat Rate from IRR Target
   */
  solveFlatFromIRR() {
    try {
      const irrTarget = $('irrTargetPct').value / 100;
      
      if (irrTarget <= 0) {
        throw new Error('กรุณากำหนด IRR Target');
      }

      const flatRate = this.calculator.solveFlatRateFromIRR(irrTarget);

      if (!isFinite(flatRate) || flatRate < 0) {
        throw new Error('ไม่สามารถคำนวณ Flat Rate ได้ (ค่ามากเกินไป)');
      }

      // Set and recalc
      setVal('flatRate', (flatRate * 100).toFixed(4));
      this.recalculate();

      this.ui.showSuccess(
        `✅ Flat = ${(flatRate * 100).toFixed(4)}% ` +
        `(IRR ≈ ${(irrTarget * 100).toFixed(4)}%)`
      );
    } catch (error) {
      this.ui.showError('❌ ' + error.message);
    }
  }

  /**
   * Solve: Down Payment from Target Monthly
   */
  goalSeekDown() {
    try {
      const target = $('targetMonthlyInc').value;

      if (!(target > 0)) {
        throw new Error('กรุณากรอกค่างวดเป้าหมาย');
      }

      const down = this.calculator.solveDownPaymentFromTarget(target);

      // Set and recalc
      setVal('downType', 'amount');
      setVal('downInput', String(down));
      this.recalculate();

      const inputs = this.ui.readInputs();
      this.calculator.inputs = inputs;
      const finalPmt = this.calculator.calculateMonthlyPaymentRounded();

      if (finalPmt === parseInt(target)) {
        this.ui.showSuccess(
          `✅ เงินดาวน์ ${down.toLocaleString('th-TH')} บาท ` +
          `→ ค่างวด ${finalPmt.toLocaleString('th-TH')} บาท`
        );
      } else {
        this.ui.showSuccess(
          `⚠ ใกล้เคียง: ดาวน์ ${down.toLocaleString('th-TH')} ` +
          `→ ${finalPmt.toLocaleString('th-TH')} บาท`
        );
      }
    } catch (error) {
      this.ui.showError('❌ ' + error.message);
    }
  }

  /**
   * Print quotation
   */
  print() {
    window.print();
  }

  /**
   * Export as Excel/HTML
   */
  exportExcel() {
    try {
      const wsTable = $('ws_table').outerHTML;
      const quoteSection = $('quoteSection').outerHTML;
      
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Calibri, Arial; font-size: 11pt; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ccc; padding: 5px; }
              th { background: #eef2f7; }
            </style>
          </head>
          <body>
            <h2>OWS Working Sheet</h2>
            ${wsTable}
            <h2>Quotation</h2>
            ${quoteSection}
          </body>
        </html>
      `;
      
      const dt = new Date();
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(
        new Blob([html], { type: 'application/vnd.ms-excel' })
      );
      a.download = `OWS_Quotation_${y}${m}${d}.xls`;
      a.click();
      URL.revokeObjectURL(a.href);
      
      this.ui.showSuccess('✅ Exported');
    } catch (error) {
      this.ui.showError('❌ Export failed: ' + error.message);
    }
  }

  /**
   * Reset ทั้งหมด
   */
  resetAll() {
    if (!confirm('รีเซ็ตทั้งหมด?')) return;
    
    this.loadValues(DEFAULT_VALUES);
    this.recalculate();
    this.ui.showSuccess('✅ Reset');
  }

  /**
   * Clear localStorage
   */
  clearStorage() {
    if (!confirm('ลบข้อมูลที่บันทึกไว้?')) return;
    
    this.storage.clear();
    this.ui.showSuccess('✅ Cleared');
  }
}

/**
 * Initialize on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
