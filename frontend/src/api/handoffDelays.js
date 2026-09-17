const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all handoff delays from the admin handoff delays endpoint
export async function getHandoffDelays() {
  try {
    // Send GET request to the handoff delays API
    const res = await fetch(`${API_BASE_URL}/admin/handoffdelays`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load handoff delays: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load handoff delays:", err);
  }
}

// Create a new handoff delay through the admin handoff delays endpoint
export async function createHandoffDelay(handoffDelay) {
  try {
    // Send POST request with the handoff delay form data
    const res = await fetch(`${API_BASE_URL}/admin/handoffdelays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the handoff delay object into JSON text for HTTP transport
      body: JSON.stringify({
        id: handoffDelay.id,
        handoff_id: handoffDelay.handoff_id,
        reason: handoffDelay.reason,
        delay_hours: handoffDelay.delay_hours,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create handoff delay: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create handoff delay request failed:", err);
  }
}

// Fetch a single handoff delay by its ID
export async function getHandoffDelay(id) {
  try {
    // Send GET request to the specific handoff delay endpoint
    const res = await fetch(`${API_BASE_URL}/admin/handoffdelays/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load handoff delay: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load handoff delay:", err);
  }
}

// Update an existing handoff delay through the admin handoff delays endpoint
export async function updateHandoffDelay(id, handoffDelay) {
  try {
    // Send PUT request with the updated handoff delay form data
    const res = await fetch(`${API_BASE_URL}/admin/handoffdelays/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },

      // Convert the handoff delay object into JSON text for HTTP transport
      body: JSON.stringify({
        id: handoffDelay.id,
        handoff_id: handoffDelay.handoff_id,
        reason: handoffDelay.reason,
        delay_hours: handoffDelay.delay_hours,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update handoff delay: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update handoff delay request failed:", err);
  }
}

// Delete an existing handoff delay through the admin handoff delays endpoint
export async function deleteHandoffDelay(id) {
  try {
    // Send DELETE request to the specific handoff delay endpoint
    const res = await fetch(`${API_BASE_URL}/admin/handoffdelays/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete handoff delay: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete handoff delay request failed:", err);
  }
}
