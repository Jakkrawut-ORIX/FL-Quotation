export default function Quotation({ form, result }) {
  return (
    <div className="quotation">
      <h2>QUOTATION</h2>

      <p>Customer: {form.custName}</p>
      <p>Asset: {form.assetName}</p>

      <table>
        <thead>
          <tr>
            <th>Price</th>
            <th>Deposit</th>
            <th>PMT</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>{form.gross}</td>
            <td>{form.downInput}</td>
            <td>{result.pmtRounded}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
