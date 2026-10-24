import { supabaseSyncService } from "../lib/supabase/sync-service";

async function main() {
  console.log("Testing Supabase connection...");
  const conn = await supabaseSyncService.testConnection();
  console.log("Connection result:", conn);

  if (!conn.connected) {
    console.error("Failed to connect:", conn.message);
    process.exit(1);
  }

  console.log("Pushing all local site records to Supabase Cloud PostgreSQL...");
  const pushRes = await supabaseSyncService.pushAllLocalDataToSupabase();
  console.log("Push result:", pushRes);

  console.log("Checking updated table row counts...");
  const counts = await supabaseSyncService.getTableCounts();
  console.log("Table row counts in Supabase:", counts);
}

main().catch(console.error);
