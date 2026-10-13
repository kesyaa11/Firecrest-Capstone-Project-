import { useEffect, useState } from "react";
import { getUsers } from "../api/users";

export default function Users() {
  const [users, setUsers] = useState([]);

  // Load user data from the API when the component loads.
  useEffect(() => {
    async function loadUsers() {
      const data = await getUsers();
      setUsers(data);
      console.log("react side ", data);
    }

    loadUsers();
  }, []);

  return <></>;
}
