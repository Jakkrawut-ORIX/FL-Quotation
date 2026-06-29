import { fmt0, fmt2 } from "../utils/format";

export default function ResultPanel({ result }) {
  return (
    <div className="card">
      <h2>Result</h2>

      <div>PMT: {fmt0(result.pmtRounded)}</div>
      <div>Net Price: {fmt2(result.net)}</div>
      <div>Finance: {fmt2(result.finance)}</div>
      <div>Interest: {fmt2(result.totalInterest)}</div>
      <div>Commission: {fmt2(result.commission)}</div>
    </div>
  );
}
