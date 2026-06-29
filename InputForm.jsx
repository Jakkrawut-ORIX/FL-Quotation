export default function InputForm({ form, setForm }) {
  function update(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  return (
    <div className="card">
      <h2>Input</h2>

      <label>Gross Price</label>
      <input
        type="number"
        value={form.gross}
        onChange={e => update("gross", Number(e.target.value))}
      />

      <label>Discount</label>
      <input
        type="number"
        value={form.discount}
        onChange={e => update("discount", Number(e.target.value))}
      />

      <label>Flat Rate (%)</label>
      <input
        type="number"
        value={form.flatRate}
        onChange={e => update("flatRate", Number(e.target.value))}
      />

      <label>Term (years)</label>
      <input
        type="number"
        value={form.termVal}
        onChange={e => update("termVal", Number(e.target.value))}
      />

      <label>Down Payment</label>
      <input
        type="number"
        value={form.downInput}
        onChange={e => update("downInput", Number(e.target.value))}
      />
    </div>
  );
}
