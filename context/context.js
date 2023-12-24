import { createContext, useState } from "react";
export const StatusContext = createContext()

export default function StatusContextProvider({children}){
    const [currentUser, setCurrentUser] = useState(null)
    const [accountData, setAccountData] = useState(null)
    const value = {
        currentUser,
        setCurrentUser,
        accountData,
        setAccountData
    }
    return <StatusContext.Provider value = {value} >{children}</StatusContext.Provider>
}