import { getAccessTokenServer } from './src/lib/cj-api';

async function main() {
  try {
    const token = await getAccessTokenServer();
    console.log("Token retrieved successfully:", token ? "YES" : "NO");
    console.log(token.substring(0, 10) + '...');
  } catch (err) {
    console.error("Token error:", err);
  }
}

main();
