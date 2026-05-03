import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import Goal from "@/models/Goal";

export default async function Home() {
  let status = "Not Connected";

  try {
    await dbConnect();
    const count = await Goal.countDocuments();
    status = `Successfully Connected to MongoDB. Total Goals: ${count}`;
  } catch (error) {
    status = `Connection failed: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  return (
    <main className = "p-8">
      <h1 className = "text-2xl font-bold mb-4">Taskflow</h1>
      <p>Goal management baseline version</p>
      <p>{status}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href = "/goals" 
          className = "inline-block rounded bg-black px-4 py-2 text-white">
            Goal Management
        </Link>
        <Link href = "/schedules" 
          className = "inline-block rounded border px-4 py-2">
            Schedule Management
        </Link>
      </div>
    </main>
  );
}
