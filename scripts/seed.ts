import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { user } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding initial users...\n");

  // Create admin user
  try {
    const adminResult = await auth.api.signUpEmail({
      body: {
        email: "admin@csatcracker.com",
        password: "admin12345",
        name: "Prerit (Admin)",
      },
    });
    console.log("Admin user created:", adminResult.user.email);
  } catch (e: unknown) {
    const error = e as Error;
    console.log("Admin user may already exist:", error.message);
  }

  // Set admin role directly via Drizzle
  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, "admin@csatcracker.com"));
  console.log("Admin role set for: admin@csatcracker.com");

  // Create student user
  try {
    const studentResult = await auth.api.signUpEmail({
      body: {
        email: "student@csatcracker.com",
        password: "student12345",
        name: "Student",
      },
    });
    console.log("Student user created:", studentResult.user.email);
  } catch (e: unknown) {
    const error = e as Error;
    console.log("Student user may already exist:", error.message);
  }

  console.log("\nSeeding complete!");
  console.log("\nCredentials:");
  console.log("  Admin:   admin@csatcracker.com / admin12345");
  console.log("  Student: student@csatcracker.com / student12345");
}

seed().catch(console.error);
