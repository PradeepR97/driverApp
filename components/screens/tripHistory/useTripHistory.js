import { useMemo, useState } from "react";
const TRIPS = [
    {
        id: "1",
        date: "Jan 15, 2024 • 10:30 AM",
        pickup: "Anna Nagar, Chennai",
        drop: "T. Nagar, Chennai",
        payment: "online",
        fare: 350,
    },
    {
        id: "2",
        date: "Jan 15, 2024 • 2:15 PM",
        pickup: "Velachery",
        drop: "Guindy",
        payment: "cash",
        fare: 280,
    },
    {
        id: "3",
        date: "Jan 14, 2024 • 9:00 AM",
        pickup: "Adyar",
        drop: "Mylapore",
        payment: "online",
        fare: 150,
    },
];
export function useTripHistory() {
    const [tab, setTab] = useState("today");
    const trips = useMemo(() => {
        void tab;
        return TRIPS;
    }, [tab]);
    return { tab, setTab, trips };
}
