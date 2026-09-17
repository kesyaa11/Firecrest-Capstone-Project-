const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all specification handoffs from the admin specification handoffs endpoint
export async function getSpecificationHandoffs() {
  try {
    // Send GET request to the specification handoffs API
    const res = await fetch(`${API_BASE_URL}/admin/specificationhandoffs`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load specification handoffs: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load specification handoffs:", err);
  }
}

// Create a new specification handoff through the admin specification handoffs endpoint
export async function createSpecificationHandoff(specificationHandoff) {
  try {
    // Send POST request with the specification handoff form data
    const res = await fetch(`${API_BASE_URL}/admin/specificationhandoffs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the specification handoff object into JSON text for HTTP transport
      body: JSON.stringify({
        id: specificationHandoff.id,
        project_id: specificationHandoff.project_id,
        specification_id: specificationHandoff.specification_id,
        notified: specificationHandoff.notified,
        expected: specificationHandoff.expected,
        status: specificationHandoff.status,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create specification handoff: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create specification handoff request failed:", err);
  }
}

// Fetch a single specification handoff by its ID
export async function getSpecificationHandoff(id) {
  try {
    // Send GET request to the specific specification handoff endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/specificationhandoffs/${id}`,
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load specification handoff: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load specification handoff:", err);
  }
}

// Update an existing specification handoff through the admin specification handoffs endpoint
export async function updateSpecificationHandoff(id, specificationHandoff) {
  try {
    // Send PUT request with the updated specification handoff form data
    const res = await fetch(
      `${API_BASE_URL}/admin/specificationhandoffs/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },

        // Convert the specification handoff object into JSON text for HTTP transport
        body: JSON.stringify({
          id: specificationHandoff.id,
          project_id: specificationHandoff.project_id,
          specification_id: specificationHandoff.specification_id,
          notified: specificationHandoff.notified,
          expected: specificationHandoff.expected,
          status: specificationHandoff.status,
        }),
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update specification handoff: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update specification handoff request failed:", err);
  }
}

// Delete an existing specification handoff through the admin specification handoffs endpoint
export async function deleteSpecificationHandoff(id) {
  try {
    // Send DELETE request to the specific specification handoff endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/specificationhandoffs/${id}`,
      {
        method: "DELETE",
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete specification handoff: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete specification handoff request failed:", err);
  }
}
