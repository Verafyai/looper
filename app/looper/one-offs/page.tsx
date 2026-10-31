import { getDataset } from "@/lib/dataset";

export default async function OneOffsPage() {
  const data = await getDataset();
  return (
    <div>
      <p className="page-kicker">LOOPER</p>
      <h1 className="page-title">One-offs</h1>
      <p className="lede">Reminders that are not loops. They have no score and no schedule controls.</p>
      <table data-testid="oneoffs-table" className="oneoffs">
        <thead>
          <tr>
            <th>Reminder</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.oneOffs.length === 0 ? (
            <tr>
              <td colSpan={3}>no data</td>
            </tr>
          ) : (
            data.oneOffs.map((item) => (
              <tr key={item.id} data-oneoff={item.id}>
                <td>{item.reminder}</td>
                <td>{item.due}</td>
                <td>{item.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
