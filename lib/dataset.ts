import { cache } from "react";
import { loadDataset } from "./adapter";

export const getDataset = cache(() => loadDataset());
