import { useState, useMemo } from "react";
import InputForm from "./components/InputForm";
import ResultPanel from "./components/ResultPanel";
import Quotation from "./components/Quotation";

import { calculate } from "./utils/calc";
import { DEFAULT_VALUES } from "./utils/constants";

export default function App() {
  const [form, setForm] = useState(DEFAULT_VALUES);

  // ✅ compute result อัตโนมัติ (แทน recalc())
  const result = useMemo(() => {
    return calculate(form);
  }, [form]);

  return (
    <div className="app">
      <h1>Financial Lease Calculator</h1>

      <div className="grid">
        <InputForm form={form} setForm={setForm} />
        <ResultPanel result={result} />
      </div>

      <Quotation form={form} result={result} />
    </div>
  );
}
