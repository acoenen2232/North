import { core } from "./core/schema";
import { morning } from "./morning/schema";
import { heading } from "./heading/schema";
import { checkin } from "./checkin/schema";
import { stars } from "./stars/schema";
import { constellations } from "./constellations/schema";
import { vera } from "./vera/schema";
import { push } from "./push/schema";

export type Migration = { id: string; sql: string };

export type ModuleSchema = {
  id: string;
  name: string;
  migrations: Migration[];
};

// Order matters only for foreign keys between modules. Add new modules (Spark, Money, Style…) at the end.
export const modules: ModuleSchema[] = [core, morning, heading, checkin, stars, constellations, vera, push];
