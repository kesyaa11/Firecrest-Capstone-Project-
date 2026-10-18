import { useEffect } from "react";
import { getUsers } from "../api/users";

export default function Users() {
  useEffect(() => {
    async function loadUsers() {
      const data = await getUsers();
      console.log("react side ", data);
    }

    loadUsers();
  }, []);

  return null;
}
