import { createContext, useState } from "react";
export const StatusContext = createContext()

export default function StatusContextProvider({children}){
    const [currentUser, setCurrentUser] = useState(null)
    const [accountData, setAccountData] = useState(null)
    const [locationData, setLocationData] = useState(null)
    const value = {
        currentUser,
        setCurrentUser,
        accountData,
        setAccountData,
        locationData,
        setLocationData
    }
    return <StatusContext.Provider value = {value} >{children}</StatusContext.Provider>
}