const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all specification development days from the admin specification development days endpoint
export async function getSpecificationDevDays() {
  try {
    // Send GET request to the specification development days API
    const res = await fetch(`${API_BASE_URL}/admin/specificationdevdays`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(
        `Failed to load specification development days: ${res.status}`,
      );
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load specification development days:", err);
  }
}

// Create new specification development days through the admin specification development days endpoint
export async function createSpecificationDevDays(specificationDevDays) {
  try {
    // Send POST request with the specification development days form data
    const res = await fetch(`${API_BASE_URL}/admin/specificationdevdays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the specification development days object into JSON text for HTTP transport
      body: JSON.stringify({
        id: specificationDevDays.id,
        specification_id: specificationDevDays.specification_id,
        specified_month: specificationDevDays.specified_month,
        dev_days: specificationDevDays.dev_days,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(
        `Failed to create specification development days: ${res.status}`,
      );
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create specification development days request failed:", err);
  }
}

// Fetch a single specification development days record by its ID
export async function getSpecificationDevDaysById(id) {
  try {
    // Send GET request to the specific specification development days endpoint
    const res = await fetch(`${API_BASE_URL}/admin/specificationdevdays/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(
        `Failed to load specification development days: ${res.status}`,
      );
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load specification development days:", err);
  }
}

// Update an existing specification development days record through the admin specification development days endpoint
export async function updateSpecificationDevDays(id, specificationDevDays) {
  try {
    // Send PUT request with the updated specification development days form data
    const res = await fetch(
      `${API_BASE_URL}/admin/specificationdevdays/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },

        // Convert the specification development days object into JSON text for HTTP transport
        body: JSON.stringify({
          id: specificationDevDays.id,
          specification_id: specificationDevDays.specification_id,
          specified_month: specificationDevDays.specified_month,
          dev_days: specificationDevDays.dev_days,
        }),
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(
        `Failed to update specification development days: ${res.status}`,
      );
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update specification development days request failed:", err);
  }
}

// Delete an existing specification development days record through the admin specification development days endpoint
export async function deleteSpecificationDevDays(id) {
  try {
    // Send DELETE request to the specific specification development days endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/specificationdevdays/${id}`,
      {
        method: "DELETE",
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(
        `Failed to delete specification development days: ${res.status}`,
      );
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete specification development days request failed:", err);
  }
}
