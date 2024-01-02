import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native"
import { setDoc, doc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { StatusContext } from "../context/context"
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { db } from "../components/config";
import { useState, useContext } from "react";
import { getAuth } from "firebase/auth";

const SignUpPage = ({navigation, route}) => {
    const [enteredEmail, setEnteredEmail] = useState("testtest@gmail.com")
    const [enteredPassword, setEnteredPassword] = useState("1234test")
    const [accountType, setAccountType] = useState(false)
    const statusContext = useContext(StatusContext)
    let auth = getAuth()
    async function signUp(){
        try{
        const userCredential = await createUserWithEmailAndPassword(auth, enteredEmail, enteredPassword)
        console.log("sign up succes " + userCredential.user.uid)
        setupUserData(userCredential.user.uid)
        navigation.navigate("loginPage")
        }catch(error){
            console.log(error)
        }
    }

    async function setupUserData(uid){
        
        try{
          await setDoc(doc(db, "users" , uid),{
            type:accountType
          })
        }catch(error){
          console.log("error addDocument" + error)
        }
      }

    return(

        <View>
            <TextInput
                onChangeText={newText => setEnteredEmail(newText)}
                value = {enteredEmail}
            />

            <TextInput
                onChangeText={newText => setEnteredPassword(newText)}
                value={enteredPassword}
            />

            <BouncyCheckbox
                text = "Resturant account"
                onPress={() => setAccountType(!accountType)}
            />

            {   accountType &&
                <>
                <Text>As a resturant account you'll be able to create and edit your locations, but you won't be able to guess recipes</Text>
                </>
            }
                

            <TouchableOpacity
                style={styles.button}
                onPress={signUp}>
                <Text style={styles.backgroundText}>Sign up</Text>
            </TouchableOpacity>
        </View>

    )
    
}

export default SignUpPage

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });