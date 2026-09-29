const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getFortnightHours(userId, periodStart) {
  try {
    // Fetch fortnight hours for a user from the admin hours endpoint
    // Send GET request to the fortnight hours API
    const response = await fetch(
      `${API_BASE_URL}/admin/hours/fortnight?userId=${userId}&periodStart=${periodStart}`,
    );

    // Stop if the API returns an NOT OK HTTP status
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the server response into a JSON object
    const data = await response.json();

    // Log data into console for debugging
    console.log(data);

    // Return the fortnight hours data
    return data;
  } catch (error) {
    // Error handling mechanism
    console.error("Error fetching fortnight hours:", error);
    throw error;
  }
}
