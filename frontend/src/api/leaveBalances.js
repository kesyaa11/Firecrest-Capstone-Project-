import { apiFetch } from "./apiFetch";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all leave balances from the admin leave balances endpoint
export async function getLeaveBalances() {
  try {
    // Send GET request to the leave balances API
    const res = await apiFetch(`${API_BASE_URL}/admin/leave-balances`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error("Failed to load leave balances");
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load leave balances:", err);
  }
}

// Create a new leave balance through the admin leave balances endpoint
export async function createLeaveBalance(leaveBalance) {
  try {
    // Send POST request with the leave balance form data
    const res = await apiFetch(`${API_BASE_URL}/admin/leave-balances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the leave balance object into JSON text for HTTP transport
      body: JSON.stringify({
        id: leaveBalance.id,
        user_id: leaveBalance.user_id,
        sick_days: leaveBalance.sick_days,
        al_accrued: leaveBalance.al_accrued,
        al_taken_accrued: leaveBalance.al_taken_accrued,
        al_outstanding: leaveBalance.al_outstanding,
        annual_working: leaveBalance.annual_working,
        alternative_days: leaveBalance.alternative_days,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create leave balance: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create leave balance failed:", err);
  }
}

// Fetch a single leave balance by its ID
export async function getLeaveBalance(id) {
  try {
    // Send GET request to the specific leave balance endpoint
    const res = await apiFetch(`${API_BASE_URL}/admin/leave-balances/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load leave balance: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load leave balance:", err);
  }
}

// Update an existing leave balance through the admin leave balances endpoint
export async function updateLeaveBalance(id, leaveBalance) {
  try {
    // Send PUT request with the updated leave balance form data
    const res = await apiFetch(`${API_BASE_URL}/admin/leave-balances/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },

      // Convert the leave balance object into JSON text for HTTP transport
      body: JSON.stringify({
        id: leaveBalance.id,
        user_id: leaveBalance.user_id,
        sick_days: leaveBalance.sick_days,
        al_accrued: leaveBalance.al_accrued,
        al_taken_accrued: leaveBalance.al_taken_accrued,
        al_outstanding: leaveBalance.al_outstanding,
        annual_working: leaveBalance.annual_working,
        alternative_days: leaveBalance.alternative_days,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update leave balance: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update leave balance request failed:", err);
  }
}

// Fetch a leave balance by user ID
export async function getLeaveBalanceByUserId(userId) {
  try {
    // Send GET request to the leave balance user endpoint
    const res = await apiFetch(
      `${API_BASE_URL}/admin/leave-balances/user/${userId}`,
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load leave balance: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load leave balance by user:", err);
  }
}
