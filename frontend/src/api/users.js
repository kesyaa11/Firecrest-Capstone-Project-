const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all users from the admin users endpoint
export async function getUsers() {
  try {
    // Send GET request to the users API
    const res = await fetch(`${API_BASE_URL}/admin/users`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error("Failed to load users");
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load users:", err);
  }
}

// Create a new user through the admin users endpoint
export async function createUser(user) {
  try {
    // Send POST request with the user form data
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Convert the user object into JSON text for HTTP transport
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        role: user.role,
        country: user.country,
        team: user.team,
        manager_id: user.manager_id,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create user: ${res.status}`);
    }

    return res;
  } catch (err) {
    // Error handling mechanism
    console.error("Create user request failed:", err);
    throw err;
  }
}

// Fetch a single user by their ID
export async function getUser(id) {
  try {
    // Send GET request to the specific user endpoint
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load user: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load user:", err);
  }
}

// Update an existing user through the admin users endpoint
export async function updateUser(id, user) {
  try {
    // Send PUT request with the updated user form data
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // Convert the user object into JSON text for HTTP transport
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        role: user.role,
        country: user.country,
        team: user.team,
        manager_id: user.manager_id,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update user: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update user request failed:", err);
  }
}

// Partially update an existing user
export async function patchUser(id, changes) {
  try {
    // Send PATCH request with only the changed fields
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },

      // Convert the changes object into JSON text for HTTP transport
      body: JSON.stringify(changes),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to patch user: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Patch user request failed:", err);
  }
}

// Delete an existing user through the admin users endpoint
export async function deleteUser(id) {
  try {
    // Send DELETE request to the specific user endpoint
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete user: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete user request failed:", err);
  }
}
