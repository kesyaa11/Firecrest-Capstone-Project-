const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all project specifications from the admin project specifications endpoint
export async function getProjectSpecifications() {
  try {
    // Send GET request to the project specifications API
    const res = await fetch(`${API_BASE_URL}/admin/projectspecifications`);

    // Stop if the API returns an NOT OK HTTP status
    if (!res.ok) {
      throw new Error("Failed to load project specifications");
    }

    // Parse the server response into a JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load project specifications:", err);
  }
}

// Create a new project specification through the admin project specifications endpoint
export async function createProjectSpecification(specification) {
  try {
    // Send POST request with the project specification form data
    const res = await fetch(`${API_BASE_URL}/admin/projectspecifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // Convert the project specification object into JSON text for HTTP transport
      body: JSON.stringify({
        id: specification.id,
        project_id: specification.project_id,
        author_id: specification.author_id,
        version: specification.version,
        content: specification.content,
        specs: specification.specs,
        build: specification.build,
        test_sheet: specification.test_sheet,
        launch_plan: specification.launch_plan,
        billing: specification.billing,
        roadmap: specification.roadmap,
        target_date: specification.target_date,
      }),
    });

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to create project specification: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Create project specification request failed:", err);
  }
}

// Fetch a single project specification by its ID
export async function getProjectSpecification(id) {
  try {
    // Send GET request to the specific project specification endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/projectspecifications/${id}`,
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to load project specification: ${res.status}`);
    }

    // Parse the server response into JSON object
    const data = await res.json();

    // Log data into console for debugging
    console.log(data);

    return data;
  } catch (err) {
    // Error handling mechanism
    console.error("Failed to load project specification:", err);
  }
}

// Update an existing project specification through the admin project specifications endpoint
export async function updateProjectSpecification(id, specification) {
  try {
    // Send PUT request with the updated project specification data
    const res = await fetch(
      `${API_BASE_URL}/admin/projectspecifications/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },

        // Convert the project specification object into JSON text for HTTP transport
        body: JSON.stringify({
          id: specification.id,
          project_id: specification.project_id,
          author_id: specification.author_id,
          version: specification.version,
          content: specification.content,
          specs: specification.specs,
          build: specification.build,
          test_sheet: specification.test_sheet,
          launch_plan: specification.launch_plan,
          billing: specification.billing,
          roadmap: specification.roadmap,
          target_date: specification.target_date,
        }),
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to update project specification: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Update project specification request failed:", err);
  }
}

// Partially update an existing project specification
export async function patchProjectSpecification(id, changes) {
  try {
    // Send PATCH request with only the changed fields
    const res = await fetch(
      `${API_BASE_URL}/admin/projectspecifications/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },

        // Convert the changes object into JSON text for HTTP transport
        body: JSON.stringify(changes),
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to patch project specification: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Patch project specification request failed:", err);
  }
}

// Delete an existing project specification through the admin project specifications endpoint
export async function deleteProjectSpecification(id) {
  try {
    // Send DELETE request to the specific project specification endpoint
    const res = await fetch(
      `${API_BASE_URL}/admin/projectspecifications/${id}`,
      {
        method: "DELETE",
      },
    );

    // Throw an error if the API returns NOT OK HTTP status
    if (!res.ok) {
      throw new Error(`Failed to delete project specification: ${res.status}`);
    }
  } catch (err) {
    // Error handling mechanism
    console.error("Delete project specification request failed:", err);
  }
}
