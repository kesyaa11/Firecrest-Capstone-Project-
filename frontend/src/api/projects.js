const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all projects from the admin projects endpoint
export async function getProjects() {
  try {
    // Send GET request to the projects API
    const res = await fetch(`${API_BASE_URL}/admin/projects`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error("Failed to load projects");
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load projects:", err);
  }
}

// Create a new project through the admin projects endpoint
export async function createProject(project) {
  try {
    // Send POST request with the project form data
    const res = await fetch(`${API_BASE_URL}/admin/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the project object into JSON text for HTTP transport
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        tracker_ref: project.tracker_ref,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create project: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create project request failed:", err);
  }
}

// Fetch a single project by its ID
export async function getProject(id) {
  try {
    // Send GET request to the specific project endpoint
    const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`);

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load project: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load project:", err);
  }
}

// Update an existing project through the admin projects endpoint
export async function updateProject(id, project) {
  try {
    // Send PUT request with the updated project form data
    const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // Convert the user object into JSON text for HTTP transport
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        tracker_ref: project.tracker_ref,
      }),
    });
    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update project: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update project request failed:", err);
  }
}

// Partially update an existing project
export async function patchProject(id, changes) {
  try {
    // Send PATCH request with only the changed fields
    const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },

      // Convert the changes object into JSON text for HTTP transport
      body: JSON.stringify(changes),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to patch project: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Patch project request failed:", err);
  }
}

// Delete an existing project through the admin projects endpoint
export async function deleteProject(id) {
  try {
    // Send DELETE request to the specific project endpoint
    const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, {
      method: "DELETE",
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete project: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete project request failed:", err);
  }
}
