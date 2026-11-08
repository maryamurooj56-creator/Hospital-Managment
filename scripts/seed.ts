import "dotenv/config";
import { seedDatabase } from "../src/lib/seed";

seedDatabase()
  .then(() => {
    console.log("CareWell demo data seeded successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("CareWell seeding failed:", error);
    process.exit(1);
  });
