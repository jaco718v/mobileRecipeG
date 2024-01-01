import { TouchableOpacity, View, Text, TextInput, StyleSheet, Image } from 'react-native'
import { doc, updateDoc } from 'firebase/firestore'
import { db, storage } from '../components/config'
import * as ImagePicker from "expo-image-picker"
import { StatusContext } from "../context/context"
import { useState, useEffect, useContext } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { ref, uploadBytes, getDownloadURL} from "firebase/storage"

const GuessListView = ({navigation, route}) => {
    const statusContext = useContext(StatusContext)
    const [difficulty, setDifficulty] = useState(false)
    const [easyList, setEasyList] = useState([])
    const [hardList , setHardList] = useState([])
    const [imagePath, setImagePath] = useState(null)
    const [showImage, setShowImage] = useState(false)
    const list = difficulty? easyList : hardList

    useEffect( () => {
        const scores = statusContext.accountData.scores[statusContext.locationData.id]
        setEasyList((statusContext.locationData.recipes.easy).map((n) => matchRecipeScore(scores, n)))
        setHardList((statusContext.locationData.recipes.hard).map((n) => matchRecipeScore(scores, n)))
    },[])


    function matchRecipeScore(scores, guessRecipe){
        if(scores[guessRecipe.id]){
            return {...guessRecipe, score: scores[guessRecipe.id].score, hasImage:scores[guessRecipe.id].hasImage, taken: true }
        } else {
            return {...guessRecipe, score: 0, taken: false}
        }
    }

    async function useCamera(recipeId){
        const result = await ImagePicker.requestCameraPermissionsAsync()
        if(result.granted === false){
            alert('No camera access')
        }
        ImagePicker.launchCameraAsync()
        .then(response => {
            if(!response.canceled){
                setImagePath(response.assets[0].uri)
                uploadImage(recipeId)
            }
        })
        .catch(error => alert('Camera error: '+ error))
    }

    async function uploadImage(recipeId){
        const res = await fetch(imagePath)
        const blob = await res.blob()
        const userId = statusContext.currentUser
        const locationId = statusContext.locationData.id
        const storageRef = ref(storage,`${userId}/${locationId}/${recipeId}.jpg`)
        uploadBytes(storageRef, blob).then((snapshot) => {
          updateHasImage()
          alert("image uploaded")
        })
      }

      async function updateHasImage(){
        await updateDoc(doc(db, "users", statusContext.currentUser, "scores" , String(statusContext.locationData.id) ),{
          hasImage:true
         }).catch((error) => {
          console.log(error)
        })
      }

    async function downloadAndDisplayImage(recipeId){
        const userId = statusContext.currentUser
        const locationId = statusContext.locationData.id
        getDownloadURL(ref(storage, `${userId}/${locationId}/${recipeId}.jpg`))
        .then((url) => {
            setImagePath(url)
            setShowImage(true)
        }).catch((error) => {
          console.log("fejl i image dowload " + error)
        })
      }

    return(
        <View>

            <TouchableOpacity onPress={() => setDifficulty(false)} >
                <Text>Easy</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDifficulty(true)} >
                <Text>Hard</Text>
            </TouchableOpacity>


            {   showImage &&
            <>

                <View>
                    <TouchableOpacity style={styles.imageContainer}> 
                        <Image source={{uri:imagePath}}/> 
                    </TouchableOpacity>
                </View>

            </>
            }

            <FlatList
                data={list}
                renderItem={(recipe) => 
                <View>
                    <Text style={styles.listItem} onPress={()=>{
                        if(!recipe.item.score)
                            difficulty? navigation.navigate("guessHardPage", {guessContent: recipe.item}) : navigation.navigate("guessEasyPage", {guessContent: recipe.item}) }}>
                        {recipe.item.name} 
                    </Text>
                    {   recipe.item.score &&
                        <>
                        <Text>{recipe.item.score}</Text>
                        </>

                    }
                    
                    { recipe.item.taken &&
                    <>
                        <MaterialIcons name={recipe.item.imageId? "camera" : 'camerao'} 
                        onPress={recipe.item.imageId? () => downloadAndDisplayImage(recipe.item.id) : useCamera(recipe.item.id)}
                        size={12}/>
                    </>

                    }
                    
                    
                    <MaterialIcons name={ recipe.item.score >= 50 ? "star" : "star-border"} size={12}/>
                    <MaterialIcons name={ recipe.item.score >= 75 ? "star" : "star-border"} size={12}/>
                    <MaterialIcons name={ recipe.item.score >= 105 ? "star" : "star-border"} size={12}/>
                </View>  
                        
                    
                    }
            />

        </View>
    )
}

export default GuessListView

const styles = StyleSheet.create({
    imageContainer: {
        position: 'absolute', // Stuff
        width: '100%',
        height: '100%'
    }

})