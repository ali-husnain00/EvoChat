import { createContext, useEffect, useState } from "react";

export const ChatContext = createContext(null);

const ChatContextProvider = ({ children }) => {

    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false)

    const getLoggedInUser = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/getLoggedInUser`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                console.error("Failed to fetch logged-in user");
            }
        } catch (error) {
            console.error("Error fetching logged-in user:", error);
        }
        finally {
            setLoading(false)
        }
    };

    const updateStatus = async () => {
        try {
            const res = await fetch(`${BASE_URL}/updateStatus`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            if (res.ok) {
                console.error("Status updated successfully");
            }
            else {
                console.error("Failed to update status");
            }

        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

   useEffect(() =>{
     if(user){
        updateStatus();
    }
   },[user])

    useEffect(() => {
        getLoggedInUser();
    }, []);

    const value = {
        BASE_URL,
        getLoggedInUser,
        user,
        setUser,
        loading
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export default ChatContextProvider
