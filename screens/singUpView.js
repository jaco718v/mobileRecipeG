import { View } from "react-native"
import { addDoc, collection } from 'firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { StatusContext } from "../context/context"
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { db } from './components/config'
import { useState } from "react";

const SignUpPage = ({navigation, route}) => {
    const [enteredEmail, setEnteredEmail] = useState("testtest@gmail.com")
    const [enteredPassword, setEnteredPassword] = useState("1234test")
    const [accountType, setAccountType] = useState(false)
    const statusContext = useContext(StatusContext)
    let auth = route.params?.auth

    async function signUp(){
        try{
        const userCredential = await createUserWithEmailAndPassword(auth, enteredEmail, enteredPassword)
        console.log("sign up succes " + userCredential.user.uid)
        setupUserData(userCredential)
        navigation.navigate("MapPage")
        }catch(error){

        }
    

    }

    async function setupUserData(userCredentials){
        try{
          await addDoc(collection(db,userCredentials.user.id),{
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
                onPress={setAccountType(!accountType)}
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