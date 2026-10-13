import { apiFetch } from "./apiFetch";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all specification users from the admin specification users endpoint
export async function getSpecificationUsers() {
  try {
    // Send GET request to the specification users API
    const res = await apiFetch(`${API_BASE_URL}/admin/specificationusers`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load specification users: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load specification users:", err);
  }
}

// Create a new specification user through the admin specification users endpoint
export async function createSpecificationUser(specificationUser) {
  try {
    // Send POST request with the specification user form data
    const res = await apiFetch(`${API_BASE_URL}/admin/specificationusers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the specification user object into JSON text for HTTP transport
      body: JSON.stringify({
        id: specificationUser.id,
        project_id: specificationUser.project_id,
        specification_id: specificationUser.specification_id,
        user_id: specificationUser.user_id,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create specification user: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create specification user request failed:", err);
  }
}

// Fetch a single specification user by its ID
export async function getSpecificationUser(id) {
  try {
    // Send GET request to the specific specification user endpoint
    const res = await apiFetch(`${API_BASE_URL}/admin/specificationusers/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load specification user: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load specification user:", err);
  }
}

// Update an existing specification user through the admin specification users endpoint
export async function updateSpecificationUser(id, specificationUser) {
  try {
    // Send PUT request with the updated specification user form data
    const res = await apiFetch(`${API_BASE_URL}/admin/specificationusers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },

      // Convert the specification user object into JSON text for HTTP transport
      body: JSON.stringify({
        id: specificationUser.id,
        project_id: specificationUser.project_id,
        specification_id: specificationUser.specification_id,
        user_id: specificationUser.user_id,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update specification user: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update specification user request failed:", err);
  }
}

// Delete an existing specification user through the admin specification users endpoint
export async function deleteSpecificationUser(id) {
  try {
    // Send DELETE request to the specific specification user endpoint
    const res = await apiFetch(`${API_BASE_URL}/admin/specificationusers/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete specification user: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete specification user request failed:", err);
  }
}
