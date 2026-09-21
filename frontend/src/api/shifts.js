const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all shifts from the admin shifts endpoint
export async function getShifts() {
  try {
    // Send GET request to the shifts API
    const res = await fetch(`${API_BASE_URL}/admin/shifts`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load shifts: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load shifts:", err);
  }
}

// Create a new shift through the admin shifts endpoint
export async function createShift(shift) {
  const res = await fetch(`${API_BASE_URL}/admin/shifts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    // Convert the shift object into JSON text for HTTP transport
    body: JSON.stringify({
      user_id: shift.user_id,
      date: shift.date,
      duration: shift.duration,
      shift_start: shift.shift_start,
      shift_end: shift.shift_end,
      shifts_count: shift.shifts_count,
      slot_number: shift.slot_number,
      project_id: shift.project_id,
      specification_id: shift.specification_id,
      work_type: shift.work_type,
    }),
  });

  const data = await res.json();

  // Pass the backend's useful validation message back to the modal.
  if (!res.ok) {
    throw new Error(data.message || `Failed to create shift: ${res.status}`);
  }

  return data;
}

// Fetch a single shift by its ID
export async function getShift(id) {
  try {
    // Send GET request to the specific shift endpoint
    const res = await fetch(`${API_BASE_URL}/admin/shifts/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load shift: ${res.status}`);
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load shift:", err);
  }
}

// Update an existing shift through the admin shifts endpoint
export async function updateShift(id, shift) {
  try {
    // Send PUT request with the updated shift form data
    const res = await fetch(`${API_BASE_URL}/admin/shifts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },

      // Convert the shift object into JSON text for HTTP transport
      body: JSON.stringify({
        id: shift.id,
        user_id: shift.user_id,
        date: shift.date,
        duration: shift.duration,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
        slot_number: shift.slot_number,
        project_id: shift.project_id,
        specification_id: shift.specification_id,
        work_type: shift.work_type,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update shift: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update shift request failed:", err);
  }
}

// Partially update an existing shift
export async function patchShift(id, changes) {
  try {
    // Send PATCH request with only the changed fields
    const res = await fetch(`${API_BASE_URL}/admin/shifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },

      // Convert the changes object into JSON text for HTTP transport
      body: JSON.stringify(changes),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to patch shift: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Patch shift request failed:", err);
  }
}

// Delete an existing shift through the admin shifts endpoint
export async function deleteShift(id) {
  try {
    // Send DELETE request to the specific shift endpoint
    const res = await fetch(`${API_BASE_URL}/admin/shifts/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete shift: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete shift request failed:", err);
  }
}
