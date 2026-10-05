const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch the fortnight report for every user, periodStart is a YYYY-MM-DD Tuesday
export async function getFortnightHoursForAllUsers(periodStart) {
  try {
    // Send GET request to the fortnight hours API
    const res = await fetch(
      `${API_BASE_URL}/admin/hours/fortnight/all?periodStart=${periodStart}`,
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load fortnight hours: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load fortnight hours:", err);
  }
}
