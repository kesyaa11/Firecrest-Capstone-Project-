import { apiFetch } from "./apiFetch";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Get all specification change requests
export async function getSpecificationChangeRequests() {
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/admin/specification-change-requests`
    );

    if (!res.ok) {
      throw new Error(
        `Failed to get specification change requests: ${res.status}`
      );
    }

    return await res.json();
  } catch (err) {
    console.error(
      "Get specification change requests failed:",
      err
    );
    throw err;
  }
}


// Create a new specification change request
export async function createSpecificationChangeRequest(changeRequest) {
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/admin/specification-change-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specification_id: changeRequest.specification_id,
          requester_id: changeRequest.requester_id,
          stage: changeRequest.stage,
          reason: changeRequest.reason,
          created_at: new Date().toISOString(),
          resolved: false,
        }),
      }
    );

    if (!res.ok) {
      throw new Error(
        `Failed to create specification change request: ${res.status}`
      );
    }

    return await res.json();
  } catch (err) {
    console.error(
      "Create specification change request failed:",
      err
    );
    throw err;
  }
}


// Update an existing specification change request
export async function updateSpecificationChangeRequest(id, changeRequest) {
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/admin/specification-change-requests/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changeRequest),
      }
    );

    if (!res.ok) {
      throw new Error(
        `Failed to update specification change request: ${res.status}`
      );
    }
  } catch (err) {
    console.error(
      "Update specification change request failed:",
      err
    );
    throw err;
  }
}