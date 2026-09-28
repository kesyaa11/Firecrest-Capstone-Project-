const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all public holidays from the admin public holidays endpoint
export async function getPublicHolidays() {
  try {
    // Send GET request to the public holidays API
    const res = await fetch(`${API_BASE_URL}/admin/publicholidays`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load public holidays: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load public holidays:", err);
  }
}

// Sync public holidays for a specific year and country
export async function syncPublicHolidays(year, country) {
  try {
    // Send POST request to sync public holidays for the specified year and country
    const res = await fetch(
      `${API_BASE_URL}/admin/publicholidays/sync/${year}/${country}`,
      {
        method: "POST",
      },
    );

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to sync public holidays: ${res.status}`);
    }

    // Return the server response
    return res;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to sync public holidays:", err);
  }
}

// Fetch a single public holiday by its ID
export async function getPublicHoliday(id) {
  try {
    // Send GET request to the specific public holiday endpoint
    const res = await fetch(`${API_BASE_URL}/admin/publicholidays/${id}`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load public holiday: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load public holiday:", err);
  }
}

// Fetch all public holidays for a specific country
export async function getPublicHolidaysByCountry(country) {
  try {
    // Send GET request to the public holidays country endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/publicholidays/country/${country}`,
    );

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load public holidays: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load public holidays:", err);
  }
}

// Fetch public holidays for a specific country and date
export async function getPublicHolidaysByCountryAndDate(country, date) {
  try {
    // Send GET request to the public holidays country and date endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/publicholidays/country/${country}/date/${date}`,
    );

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load public holidays: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load public holidays:", err);
  }
}
