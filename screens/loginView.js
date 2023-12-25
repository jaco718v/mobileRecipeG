import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { app } from './components/config';
import { StatusContext } from "../context/context"
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import  ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const LoginPage = ({navigation, route}) => {

    let auth
    if(Platform.OS === 'web'){
    auth = getAuth(app)
    }else{
    auth = initializeAuth(auth, {
        persistence:getReactNativePersistence(ReactNativeAsyncStorage)
    })
    }

    const [enteredEmail, setEnteredEmail] = useState("jacobankerm@gmail.com")
    const [enteredPassword, setEnteredPassword] = useState("123test")
    const [userId, setUserId] = useState(null)
    const statusContext = useContext(StatusContext)

    useEffect(()=>{
        const auth_ = getAuth()
        const unsubscribe = onAuthStateChanged(auth_, (currentUser) => {
        if(currentUser){
            statusContext.setCurrentUser(currentUser)
            setUserId(currentUser.uid)
            getAccountData()
        }else{
            statusContext.setCurrentUser(null)
            setUserId(null)
        }
        })
        return () => unsubscribe()
    },[])


    async function getAccountData(){
        userdata = await getDoc(doc(db,statusContext.currentUser.uid ))
        statusContext.setAccountData({...userdata.data(), id: userdata.id})
    }

    async function signOut_(){
        await signOut(auth)
    }
    
    
    async function login(){
        try{
        const userCredential = await signInWithEmailAndPassword(auth, enteredEmail, enteredPassword)
        console.log('Logged in' + userCredential.user.uid)
        }catch(error){
        console.log(error)
        }
    }

    return (
        <View style={styles.container}>

        <Text>Login-Guesser</Text>

        { !userId &&
            <>
        <Text>Login</Text>

        <TextInput
        onChangeText={newText => setEnteredEmail(newText)}
        value = {enteredEmail}
        />

        <TextInput
        onChangeText={newText => setEnteredPassword(newText)}
        value={enteredPassword}
        />

        <Button
        title='Login'
        onPress={login}
        />
        
        <Button
        title='Sign Up'
        onPress={() => 
            navigation.navigate("SignUpPage")
        }
        />

        <Text
            onPress={() => 
            navigation.navigate("MapPage", {auth:auth})
        }
        >Play without an Account</Text>

        </>}


        { userId &&
        <>

        <Button
        title='Sign out'
        onPress={signOut_}
        />

        </>}

        <StatusBar style="auto" />
        </View>
    );
}

export default LoginPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
