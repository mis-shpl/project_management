import { useMemo } from "react";
import { getUserAccess } from "../services/accessControl";

export function useUserAccess() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const queryEmail = params.get("email");

        if (queryEmail) {
            sessionStorage.setItem("visitor_email", queryEmail);
            return getUserAccess(queryEmail);
        }

        const storedEmail = sessionStorage.getItem("visitor_email");
        return getUserAccess(storedEmail);
    }, []);
}