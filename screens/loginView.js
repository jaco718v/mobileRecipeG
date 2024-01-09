import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native';
import { useState, useEffect, useContext } from 'react';
import { db } from '../components/config';
import { StatusContext } from "../context/context"
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth'
import { RadioButton } from 'react-native-paper';
import { successToast, errorToast } from '../util/util';


const LoginPage = ({navigation, route}) => {
    let auth = getAuth()
    const statusContext = useContext(StatusContext)
    const [enteredEmail, setEnteredEmail] = useState("")
    const [enteredPassword, setEnteredPassword] = useState("")
    const [userId, setUserId] = useState(null)
    const [createType, setCreateType] = useState(true)
    const [accountType, setAccountType] = useState(false)
    

    useEffect(()=>{
        const auth_ = getAuth()
        const unsubscribe = onAuthStateChanged(auth_, (currentUser) => {
        if(currentUser){
            statusContext.setCurrentUser(currentUser)
            setUserId(currentUser.uid)
            getAccountData(currentUser)
        }else{
            statusContext.setCurrentUser(null)
            statusContext.setAccountData(null)
            setUserId(null)
        }
        })
        return () => unsubscribe()
    },[])


    async function getAccountData(data){
        try{
            const userdata = await getDoc(doc(db ,"users" , data.uid ))
            statusContext.setAccountData({...userdata.data(), id: userdata.id})
        }catch(error){
            errorToast('Error getting accountData')
        }
    }

    

    async function signOut_(){
        await signOut(auth)
    }
    

    async function signUp(){
        try{
            const userCredential = await createUserWithEmailAndPassword(auth, enteredEmail, enteredPassword)
            console.log("sign up success " + userCredential.user.uid)
            setupUserData(userCredential.user.uid)
        }catch(error){
            console.log("oi")
            errorToast('Email already has an account')
        }
    }

    async function setupUserData(uid){
        try{
          await setDoc(doc(db, "users" , uid),{
            type:accountType,
            totalScore:0
          })
        }catch(error){
          console.log("error addDocument" + error)
        }
      }

    
    async function login(){
        try{
            const userCredential = await signInWithEmailAndPassword(auth, enteredEmail, enteredPassword)
            successToast("Successfully logged in")

        }catch(error){
            errorToast('Incorrect email/password')
        }
    }


    return (
        <View style={styles.container}>

        <TouchableOpacity
                activeOpacity={1}
                style={styles.screenWideClick}
                onPress={() => {
                    if(statusContext.currentUser !== null && statusContext.accountData != null && statusContext.accountData.type !== null){
                        navigation.navigate("mapPage")
                    }
                }}
        >

        <Text style={styles.title}>Login-Guesser</Text>

        { !userId &&
            <>
        <View style={styles.subTitleBox}>
            <TouchableOpacity onPress={() => setCreateType(true)} style={styles.subTitle}>
                <Text style={createType? styles.active : null}>Login</Text>
            </TouchableOpacity>
            


            <TouchableOpacity onPress={() => setCreateType(false)} style={styles.subTitle}>
                <Text style={createType? null : styles.active} >Sign up</Text>
            </TouchableOpacity>
            
        </View>
        <TextInput
            style={styles.input}
            onChangeText={newText => setEnteredEmail(newText)}
            value = {enteredEmail}
        />

        <TextInput
            style={styles.input}
            onChangeText={newText => setEnteredPassword(newText)}
            value={enteredPassword}
        />

        { createType &&
         <>

        <TouchableOpacity onPress={login} style={styles.button}>
            <Text>Login</Text>
        </TouchableOpacity>

        </>   
        }

        { !createType &&
         <>
        <View style={styles.radios}>

            <RadioButton
            value="User Account"
            status={ accountType ? 'unchecked' : 'checked' }
            onPress={() => setAccountType(false)}
            />

            <Text style={styles.radiosText}>User Account</Text>

            <RadioButton
            value="Resturant account"
            status={ accountType ? 'checked' : 'unchecked' }
            onPress={() => setAccountType(true)}
            />

            <Text style={styles.radiosText}>Resturant Account</Text>

        </View>

            {   accountType &&
            <>
            <Text style={styles.infoText}>As a resturant account you'll be able to create and edit your location, but you won't be able to guess recipes</Text>
            </>
            }
            

            <TouchableOpacity
            style={styles.button}
            onPress={signUp}>
            <Text>Sign up</Text>
            </TouchableOpacity>

        </>   
        }

        <Text
            style={styles.noAccount}
            onPress={() => {
                statusContext.setAccountData({type: null})
                statusContext.setCurrentUser({uid:"none"})    
                navigation.navigate("mapPage")
            }
        }
        >Play without an Account</Text>

        </>}


        { userId &&
        <>

        <Text>Tab anywhere to start</Text>
        

        <TouchableOpacity         
        onPress={(event) => {
            event.stopPropagation()
            signOut_()
        }}
         style={styles.button}>
            <Text>Sign out</Text>
        </TouchableOpacity>

        </>}

        <StatusBar style="auto" />
        </TouchableOpacity>
        </View>
    );
}

export default LoginPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: "#a1e0e9",
      },
    screenWideClick: {
        height: '100%',
        width: '100%',
        // backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontWeight: "bold",
        fontFamily: 'sans-serif-condensed',
        fontSize: 32,
        textAlign:"center",
        borderBottomColor: "black",
        borderBottomWidth: 1,
        top: -50
      },
    subTitleBox:{
        flexDirection: 'row'
      },
    subTitle: {
        flexDirection: 'row',
        fontWeight: "bold",
        fontFamily: 'notoserif',
        fontSize: 18,
        textAlign:"center",
        borderBottomColor: "black",
        borderBottomWidth: 2,
        margin:8
      },
    input: {
        borderColor: "black",
        borderWidth: 1,
        borderRadius: 8,
        padding:3,
        margin: 1,
        width:200
    },
    button:{
        backgroundColor: '#2293bb',
        fontWeight: 10,
        padding: 5,
        width: 160,
        borderRadius: 8,
        borderColor: "black",
        borderWidth: 2,
        margin: 5
    },
    radios: {
        flexDirection: "row"
      },
    radiosText: {
        top: 6
    },
    noAccount:{
        color: '#0000EE',
        margin: 30,
        borderBottomColor: '#0000EE',
        borderBottomWidth: 1,
    },
    active:{
        color: 'blue'
    }
});
