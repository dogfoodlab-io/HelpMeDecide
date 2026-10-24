import { PurchaseAlpha } from "./app/PurchaseAlpha";
import { configuredClient } from "./services/decisions";

const client = configuredClient();

export default function App() {
  return <PurchaseAlpha client={client} />;
}
