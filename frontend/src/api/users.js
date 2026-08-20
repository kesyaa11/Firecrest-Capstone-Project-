const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getUsers() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`);

    if (!res.ok) {
      throw new Error("Error loading users");
    }

    const data = await res.json();

    console.log(data);
    return data;
  } catch (err) {
    console.log(err);
  }
}
