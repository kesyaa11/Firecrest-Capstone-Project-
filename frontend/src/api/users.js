export async function getUsers() {
  try {
    const res = await fetch("http://localhost:5000/admin/users");

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
