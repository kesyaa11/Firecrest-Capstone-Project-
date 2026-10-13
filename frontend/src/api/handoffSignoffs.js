import { apiFetch } from "./apiFetch";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all handoff signoffs from the admin handoff signoffs endpoint
export async function getHandoffSignoffs() {
  try {
    // Send GET request to the handoff signoffs API
    const res = await apiFetch(`${API_BASE_URL}/admin/handoff-signoffs`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load handoff signoffs: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load handoff signoffs:", err);
  }
}

// Create a new handoff signoff through the admin handoff signoffs endpoint
export async function createHandoffSignoff(handoffSignoff) {
  try {

    //sanity check
    console.log("CREATING SIGNOFF:", handoffSignoff);
    
    // Send POST request with the handoff signoff form data
    const res = await apiFetch(`${API_BASE_URL}/admin/handoff-signoffs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the handoff signoff object into JSON text for HTTP transport
      body: JSON.stringify({
        handoff_id: handoffSignoff.handoff_id,
        signer_id: handoffSignoff.signer_id,
        handoff_message: handoffSignoff.handoff_message,
        signoff_date: handoffSignoff.signoff_date,
        success: handoffSignoff.success,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      const errorData = await res.json();
      console.error("SIGNOFF API ERROR:", errorData);
      throw new Error(`Failed to create handoff signoff: ${res.status}`);
    }

    // Parse the server response into a JSON object
    return await res.json();

  } catch (err) {
    // Error handling mechanism
    console.error("Create handoff signoff request failed:", err);
    throw err;
  }
}

// Fetch a single handoff signoff by its ID
export async function getHandoffSignoff(id) {
  try {
    // Send GET request to the specific handoff signoff endpoint
    const res = await apiFetch(`${API_BASE_URL}/admin/handoff-signoffs/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load handoff signoff: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load handoff signoff:", err);
  }
}

// Update an existing handoff signoff through the admin handoff signoffs endpoint
export async function updateHandoffSignoff(id, handoffSignoff) {
  try {
    // Send PUT request with the updated handoff signoff form data
    const res = await apiFetch(`${API_BASE_URL}/admin/handoff-signoffs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },

      // Convert the handoff signoff object into JSON text for HTTP transport
      body: JSON.stringify({
        id: handoffSignoff.id,
        handoff_id: handoffSignoff.handoff_id,
        signer_id: handoffSignoff.signer_id,
        signer_role: handoffSignoff.signer_role,
        signoff_date: handoffSignoff.signoff_date,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update handoff signoff: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update handoff signoff request failed:", err);
  }
}

// Delete an existing handoff signoff through the admin handoff signoffs endpoint
export async function deleteHandoffSignoff(id) {
  try {
    // Send DELETE request to the specific handoff signoff endpoint
    const res = await apiFetch(`${API_BASE_URL}/admin/handoff-signoffs/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete handoff signoff: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete handoff signoff request failed:", err);
  }
}
