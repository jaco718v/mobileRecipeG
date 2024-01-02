import { TouchableOpacity, View, Text, TextInput, StyleSheet, Image } from 'react-native'
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore'
import { db, storage } from '../components/config'
import * as ImagePicker from "expo-image-picker"
import { StatusContext } from "../context/context"
import { useState, useEffect, useContext } from 'react'
import { MaterialIcons, AntDesign } from '@expo/vector-icons'
import { ref, uploadBytes, getDownloadURL} from "firebase/storage"

const GuessListView = ({navigation, route}) => {
    const statusContext = useContext(StatusContext)
    const [difficulty, setDifficulty] = useState(false)
    const [guessTextList, setGuessTextList] = useState([])
    const [guessImageList , setGuessImageList] = useState([])
    const [imagePath, setImagePath] = useState(null)
    const [showImage, setShowImage] = useState(false)
    const list = difficulty? guessTextList : guessImageList

    useEffect( () => {
        const scoreRef = collection(db, "users", statusContext.currentUser, "history", String(statusContext.locationData.id), "scores")
        const textGuessRef = collection(db, "locationMarkers", String(statusContext.locationData.id), "recipes", 'textGuess')
        const imageGuessRef = collection(db, "locationMarkers", String(statusContext.locationData.id), "recipes", 'imageGuess')
        async function getCollection(collectionRef, setFunction){ 
            await getDocs(collectionRef)
            .then((n) => { 
                const loadedCollections = []
                n.forEach(doc => {
                const collectionId = doc.id
                const collectionData = doc.data()
                loadedCollections.push({id: collectionId, ...collectionData})
                setFunction([...loadedCollections])
                })
                console.log("Data loaded")
                })
            .catch((error) => {
                console.log(error)
             });   
        }
        
        
        getCollection(textGuessRef, setGuessTextList)
        getCollection(imageGuessRef, setGuessImageList)
        getCollection(scoreRef, setScoreList)
  
      },[])
  
      useEffect( () => {
        setGuessTextList((guessTextList).map((n) => matchRecipeScore(scoreList, n)))
        setGuessImageList((guessImageList).map((n) => matchRecipeScore(scoreList, n)))
      },[scoreList])



    function matchRecipeScore(scores, guessRecipe){
        const scoreIndex = scores.findIndex((n) => n.id === guessRecipe.id)
        if(scoreIndex != -1){
            return {...guessRecipe, score: scores[scoreIndex].score, hasImage:scores[scoreIndex].hasImage, taken: true }
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
          updateHasImage(recipeId)
          alert("image uploaded")
        })
      }

      async function updateHasImage(docId){
        await updateDoc(doc(db, "users", statusContext.currentUser, "history" , String(statusContext.locationData.id), "scores", String(docId) ),{
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
                    <TouchableOpacity style={styles.imageContainer} onPress={setShowImage(false)}> 
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
                            difficulty? navigation.navigate("guessTextPage", {guessContent: recipe.item}) : navigation.navigate("guessImagePage", {guessContent: recipe.item}) }}>
                        {recipe.item.name} 
                    </Text>

                    
                    { recipe.item.taken &&
                    <>

                        <Text>{recipe.item.score}</Text>
                        
                        <AntDesign name={recipe.item.imageId? "camera" : 'camerao'} 
                        onPress={recipe.item.imageId? () => downloadAndDisplayImage(recipe.item.id) : () => useCamera(recipe.item.id)}
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