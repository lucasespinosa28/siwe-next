import { auth } from "./auth";

export default async function AuthenticatedPage() {
  // 1. Fetch the session directly on the server
  const session = await auth();

  // 2. Extract the address from the session object
  const address = session?.address ?? null;

  // 3. Render based on whether the user is authenticated
  return address ? (
    <h1>Authenticated as {address}</h1>
  ) : (
    <h1>Unauthenticated</h1>
  );
}