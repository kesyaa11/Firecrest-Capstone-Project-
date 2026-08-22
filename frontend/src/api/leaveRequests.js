// Fetch all leave requests from the admin leave requests endpoint
export async function getLeaveRequests() {
  try {
    // Send GET request to the leave requests API
    const res = await fetch(`${API_BASE_URL}/admin/leave-requests`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error("Failed to load leave requests");
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load leave requests:", err);
  }
}

// Create a new leave request through the admin leave requests endpoint
export async function createLeaveRequest(leaveRequest) {
  try {
    // Send POST request with the leave request form data
    const res = await fetch(`${API_BASE_URL}/admin/leave-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the leave request object into JSON text for HTTP transport
      body: JSON.stringify({
        id: leaveRequest.id,
        user_id: leaveRequest.user_id,
        approver_id: leaveRequest.approver_id,
        start_date: leaveRequest.start_date,
        end_date: leaveRequest.end_date,
        leave_type: leaveRequest.leave_type,
        status: leaveRequest.status,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create leave request: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create leave request failed:", err);
  }
}

// Fetch a single leave request by its ID
export async function getLeaveRequest(id) {
  try {
    // Send GET request to the specific leave request endpoint
    const res = await fetch(`${API_BASE_URL}/admin/leave-requests/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load leave request: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load leave request:", err);
  }
}

// Update an existing leave request through the admin leave requests endpoint
export async function updateLeaveRequest(id, leaveRequest) {
  try {
    // Send PUT request with the updated leave request form data
    const res = await fetch(`${API_BASE_URL}/admin/leave-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },

      // Convert the leave request object into JSON text for HTTP transport
      body: JSON.stringify({
        id: leaveRequest.id,
        user_id: leaveRequest.user_id,
        approver_id: leaveRequest.approver_id,
        start_date: leaveRequest.start_date,
        end_date: leaveRequest.end_date,
        leave_type: leaveRequest.leave_type,
        status: leaveRequest.status,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update leave request: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update leave request request failed:", err);
  }
}

// Partially update an existing leave request
export async function patchLeaveRequest(id, changes) {
  try {
    // Send PATCH request with only the changed fields
    const res = await fetch(`${API_BASE_URL}/admin/leave-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },

      // Convert the changes object into JSON text for HTTP transport
      body: JSON.stringify(changes),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to patch leave request: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Patch leave request request failed:", err);
  }
}

// Delete an existing leave request through the admin leave request endpoint
export async function deleteLeaveRequest(id) {
  try {
    // Send DELETE request to the specific leave request endpoint
    const res = await fetch(`${API_BASE_URL}/admin/leave-requests/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete leave request: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete leave request request failed:", err);
  }
}
