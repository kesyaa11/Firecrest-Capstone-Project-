import { useEffect } from "react";
import { getUsers } from "../api/users";
import { getShifts } from "../api/shifts";

export default function ScheduleTest() {
  useEffect(() => {
    async function loadScheduleData() {
      const users = await getUsers();
      const shifts = await getShifts();

      console.log("USERS", users);
      console.log("SHIFTS", shifts);
    }

    loadScheduleData();
  }, []);
  return <>logging console data to visualize data</>;
}
