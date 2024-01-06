import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useContext } from 'react';
import { db, storage } from '../components/config';
import { StatusContext } from "../context/context"
import { setDoc, doc, collection } from 'firebase/firestore'
import { RadioButton } from 'react-native-paper';
import * as ImagePicker from "expo-image-picker"
import { useCollection } from 'react-firebase-hooks/firestore'
import { getNextId } from "../util/util";
import { ref, uploadBytes } from "firebase/storage"


const LocationEditorPage = ({navigation, route}) => {
    const statusContext = useContext(StatusContext)
    const [textGuessValues, textGuessLoading, textGuessError] = useCollection(collection(db, "locationMarkers", String(statusContext.accountData.locationId), 'textGuess'))
    const textGuessList = textGuessValues?.docs.map((_doc) => ({..._doc.data(), id:_doc.id}))
    const [imageGuessValues, imageGuessLoading, imageGuessError] = useCollection(collection(db, "locationMarkers", String(statusContext.accountData.locationId), 'imageGuess'))
    const imageGuessList = imageGuessValues?.docs.map((_doc) => ({..._doc.data(), id:_doc.id}))
    const [createType, setCreateType] = useState(true)
    const [enteredRecipeName, setEnteredRecipeName] = useState('Unnamed')
    const [ingredientList, setIngredientList] = useState([{name:"", id:0}])
    const [imageList, setImageList] = useState([])
    const [nextId, setNextId] = useState(0)


    useEffect (() => {
        if(textGuessList && imageGuessList){
            setNextId(getNextId([...textGuessList, ...imageGuessList]))
        }
    },[textGuessValues, imageGuessValues])


    function addIngredientField(){
        setIngredientList([...ingredientList, {name:"", id:ingredientList.length}])
    }

    function removeImage(id){
        setImageList([imageList.sort((n) => n.id != id)])
    }

    function removeIngredient(id){
        setIngredientList([ingredientList.sort((n) => n.id != id)])
    }

    async function submitTextRecipe(){
        if(ingredientList.length > 1 && ingredientList.length < 10){
            const ingredientNameList = ingredientList.map((n) => n.name)
            const scoreRef = doc(db, "locationMarkers", String(statusContext.accountData.locationId), 'textGuess', String(nextId))
                await setDoc(scoreRef,{
                    ingredients: ingredientNameList,
                    name: enteredRecipeName   
                })
            navigation.navigate('mapPage')
        } else{
            console.log("Size cannot exceed 9 or be less than 2")
        }
    }


    async function submitImageRecipe(){
        if(imageList.length > 1 && imageList.length < 7){
        uploadImages()
        const scoreRef = doc(db, "locationMarkers", String(statusContext.accountData.locationId), 'imageGuess', String(nextId))
            await setDoc(scoreRef,{
                numberOfImages: imageList.length,
                name: enteredRecipeName     
            })
        navigation.navigate('mapPage')
        } else{
            console.log("Size cannot exceed 6 or be less than 2")
        }
    }

    async function uploadImages(){
        let counter = 0
        for (let image of imageList){
            const res = await fetch(image.uri)
            const blob = await res.blob()
            const locationId = statusContext.accountData.locationId
            const storageRef = ref(storage,`ingredient-${locationId}-${nextId}-${counter++}.jpg`)
            uploadBytes(storageRef, blob).then((snapshot) => {
                console.log("image uploaded")
            })
        }
      }


    async function useCamera(){
        const result = await ImagePicker.requestCameraPermissionsAsync()
        if(result.granted === false){
            alert('No camera access')
        }
        ImagePicker.launchCameraAsync()
        .then(response => {
            if(!response.canceled){
                setImageList([...imageList, {uri: response.assets[0].uri, id: imageList.length}])
            }
        })
        .catch(error => alert('Camera error: '+ error))
    }

    async function launchImagePicker(){
        let result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true
        })
        if(!result.canceled){
          setImageList([...imageList, {uri: result.assets[0].uri, id: imageList.length}])
        }
      }


    return(
        <View style={styles.container}>
            <Text>Create a new recipe quiz</Text>

            <Button
            title='List me'
            onPress={() => console.log(imageList)}
            />

            <RadioButton
              value="Text-based Quiz"
              status={ createType ? 'checked' : 'unchecked' }
              onPress={() => setCreateType(true)}
            />
            <RadioButton
              value="Image-based Quiz"
              status={ createType ? 'unchecked' : 'checked' }
              onPress={() => setCreateType(false)}
            />

            <TextInput
                onChangeText={newText => setEnteredRecipeName(newText)}
                value={enteredRecipeName}
            />

            { createType &&
            <>
                {ingredientList.map((ingredient, i) => (
                    <View
                    key={ingredient.id}
                    >
                        <TextInput
                            
                            onChangeText={newText => setIngredientList(ingredientList.map((n) => n.id === ingredient.id ? {...n, name:newText} : n))}
                            value={ingredient.name}
                        />
                        <Text onPress={() => removeIngredient(ingredient.id)}>X</Text>
                    </View>
                ))}

                <TouchableOpacity onPress={addIngredientField}>
                    <Text>Add ingredient</Text>
                </TouchableOpacity>

            </>
            }

            { !createType &&
            <>
                <TouchableOpacity onPress={useCamera}>
                    <Text>Use Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={launchImagePicker}>
                    <Text>Select File</Text>
                </TouchableOpacity>

                <Text>Tab image to delete</Text>

                {imageList.map(image => (
                    <View
                    key={image.id}
                    >
                        <TouchableOpacity 
                        onPress={() => removeImage(image.id)}
                        >
                            <Image  source={{uri:image.uri}} style={styles.imgStyle}></Image>
                        </TouchableOpacity>
                    </View>
                ))}
            </>
            }

                <TouchableOpacity onPress={createType? submitTextRecipe : submitImageRecipe}>
                    <Text>Finish recipe quiz</Text>
                </TouchableOpacity>

        </View>
    )
}

export default LocationEditorPage

const styles = StyleSheet.create({
    container: {
      height: '100%',
      width: '100%',
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imgStyle:{
        height:60,
        width: 60
    }
})