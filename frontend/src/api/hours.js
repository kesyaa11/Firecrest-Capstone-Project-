import { apiFetch } from "./apiFetch";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch the fortnight hours for a specific user
export async function getFortnightHours(userId, periodStart) {
  try {
    // Send GET request to the fortnight hours API
    const response = await apiFetch(
      `${API_BASE_URL}/admin/hours/fortnight?userId=${userId}&periodStart=${periodStart}`,
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Return the fortnight hours data
    return await response.json();
  } catch (error) {
    // Error handling mechanism
    console.error("Error fetching fortnight hours:", error);
    throw error;
  }
}

// Fetch the fortnight report for every user, periodStart is a YYYY-MM-DD Tuesday
export async function getFortnightHoursForAllUsers(periodStart) {
  try {
    // Send GET request to the fortnight hours API
    const res = await apiFetch(
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
    throw err;
  }
}
