import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, Platform, TouchableOpacity } from 'react-native';
import { useState, useEffect, useContext } from 'react';
import { app, db } from '../components/config';
import { StatusContext } from "../context/context"
import { getDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'




const LoginPage = ({navigation, route}) => {
    let auth = getAuth()
    const [enteredEmail, setEnteredEmail] = useState("testtest@gmail.com")
    const [enteredPassword, setEnteredPassword] = useState("1234test")
    const [userId, setUserId] = useState(null)
    const statusContext = useContext(StatusContext)

    useEffect(()=>{
        const auth_ = getAuth()
        const unsubscribe = onAuthStateChanged(auth_, (currentUser) => {
        if(currentUser){
            statusContext.setCurrentUser(currentUser)
            setUserId(currentUser.uid)
            getAccountData(currentUser)
        }else{
            statusContext.setCurrentUser(null)
            setUserId(null)
        }
        })
        return () => unsubscribe()
    },[])


    async function getAccountData(data){
        const userdata = await getDoc(doc(db ,"users" , data.uid ))
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
        <View>

        <TouchableOpacity
                activeOpacity={1}
                style={styles.container}
                onPress={() => {
                    if(statusContext.currentUser !== null && statusContext.accountData.type){
                        navigation.navigate("mapPage")
                    }
                }}
        >

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

            navigation.navigate("signUpPage")
        }
        />


        <Text
            onPress={() => {
            statusContext.setAccountData({type: null})    
            navigation.navigate("mapPage")}
        }
        >Play without an Account</Text>

        </>}


        { userId &&
        <>

        <Button
        title='Sign out'
        onPress={(event) => {
            event.stopPropagation()
            signOut_()
        }}
        />

        </>}

        <StatusBar style="auto" />
        </TouchableOpacity>
        </View>
    );
}

export default LoginPage

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableBox: {

  }
});
