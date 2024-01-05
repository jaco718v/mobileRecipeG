import { StyleSheet, Text, View, Image, TouchableOpacity, Button } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { storage } from '../components/config'
import { doc, setDoc } from 'firebase/firestore'
import { StatusContext } from "../context/context"
import { ref, getDownloadURL} from "firebase/storage"
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, getRelativeCoords, useAnimatedRef, runOnJS } from 'react-native-reanimated'
import { SimpleLineIcons } from '@expo/vector-icons'

const GuessImagePage = ({navigation, route}) => {
    const guessOptions = {numberOfImages: 5, name: 'Fritt', id:0} //route.params?.guessOptions
    const currentuserUid = 'pxacYsX0cOXAqr7f50oAku90q6b2' //Temp
    const statusContext = useContext(StatusContext)
    const [guessImages, setGuessImages] = useState([])
    const animatedRef = useAnimatedRef() 
    const [showScore, setShowScore] = useState(false)
    const [score, setScore] = useState(null)
    const [trash, setTrash] = useState([])


    useEffect (() => {
        const testValue = createImageList(6, guessOptions.numberOfImages)
        
        downloadImages(testValue)
    },[])

    async function downloadImages(imageData){
        let imageRef = null
        const locationId = 1//statusContext.locationData.id
        let counter = 0
        let imageList = []
        for (let image of imageData){
            if(image.type === 'dummy'){
                imageRef = ref(storage, `dummy-${image.id}.jpg`)
            }else{
                imageRef = ref(storage, `ingredient-${locationId}-${guessOptions.id}-${image.id}.jpg`)}
            const singleImage = await getDownloadURL(imageRef)
            imageList = [...imageList, {url:singleImage, id:counter++, type:image.type}]
        
        }
        setGuessImages([...imageList])
      }

    function createImageList(totalDummies, numberOfImages){
        const dummyNumberList = []
        for(let i = 0; i < totalDummies; i++){
            dummyNumberList.push({id: i, type: 'dummy'})
        }
        const ingredientsNumberList = []
        for(let i = 0; i < numberOfImages; i++){
            ingredientsNumberList.push({id: i, type: 'real'})
        }
        dummyNumberList.sort((a, b) => 0.5 - Math.random()) //Not true random
        for(let i = 0 ; i < (totalDummies - (9 - numberOfImages)); i++){
            dummyNumberList.pop()
        }   
        return [...dummyNumberList, ...ingredientsNumberList].sort((a, b) => 0.5 - Math.random())
    }
    
    function moveToTrash(image){
        if(funk){
            setTrash([...trash, image])
            setGuessImages([guessImages.filter((n)=> n.id != image.id)])
        }
    }

    function undoTrash(){
        if(trash.length > 0 ){
        setGuessImages([...guessImages, trash[0]])
        const newList = [...trash]
        newList.shift()
        setTrash([...newList])
        }
    }

    async function checkAndSubmitAnswers(){
        let rightAnswers = 0
        for( const image in guessImages){
            if(image.type === 'real'){
                rightAnswers++
            }
        }


        let totalAnswers = guessImages.length
        if(guessImages.length < guessOptions.numberOfImages){
            totalAnswers =  guessOptions.numberOfImages
        }
        

        const score = Math.floor((rightAnswers / totalAnswers )*100)
        
        setShowScore(true)
        setScore(score)

        setTimeout(async () => {

            const scoreRef = doc(db, "users", currentuserUid, "history", String(locationId), "scores", String(recipeData.id))
            await setDoc(scoreRef,{
                score: score,
                hasImage:false
            })
            navigation.navigate("guessListPage")

        }, 2000)


    }


    const GuessItem = ({image, onMove}) => {

        const translateX = useSharedValue(0)
        const translateY = useSharedValue(0)

        const onGestureEvent = useAnimatedGestureHandler({
            onStart:(_, context) => {
                context.translateX = translateX.value
                context.translateY = translateY.value
            },
            onActive:(event, context) => {
                translateX.value = context.translateX + event.translationX
                translateY.value = context.translateY + event.translationY
            },
            onEnd:(event) => {
                const coordinates = getRelativeCoords(animatedRef, event.absoluteX, event.absoluteY)
                console.log(coordinates)
                //if(coordstuff)
                //runOnJS(onMove)(image)
                //withSpring if not
            }
        })
        
        const animateStyle = useAnimatedStyle(() =>  {
            return {
                transform: [
                    {translateX: translateX.value},
                    {translateY: translateY.value}
                ]
            }
        })

        return (
            <PanGestureHandler onGestureEvent={onGestureEvent}>
                <Animated.View style={[animateStyle]}>
                    <View style={styles.answerOptions}>
                        <Image source={{uri:image.url}} style={styles.imgStyle}></Image>
                    </View>
                </Animated.View>
            </PanGestureHandler>
        )
    }


    return (
        <GestureHandlerRootView style={styles.rootView}>
        <View style={styles.container} ref={animatedRef}>
            
            {guessImages.map((image) => (
                <GuessItem key={image.id} image={image} onMove={moveToTrash}></GuessItem>
            ))}
            
            <View style={styles.test}>
                <SimpleLineIcons name="trash" size={100} color="black" paddingRight={10}/>
            
                <TouchableOpacity style={styles.button} onPress={undoTrash}>
                    <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.button}
                onPress={checkAndSubmitAnswers}>
                    <Text style={styles.undoText}>Submit</Text>
                </TouchableOpacity>

                { showScore &&
                <>
                <View>
                    <Text>Your score: {score}</Text>
                </View>
                </>
                }
            </View>
          
        </View>
    </GestureHandlerRootView>

    )
}

export default GuessImagePage


const styles  = StyleSheet.create({
    container:{
        flex: 1, 
        backgroundColor: '#fff',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    rootView:{
        flex: 1
    },
    answerOptions:{
        flexBasis: '29.4%',
        top: -20,
        flexGrow: 0, 
        flexShrink: 0,                     
        paddingRight: 10,
        paddingLeft: 10,
        paddingBottom: -10,
        marginBottom: -20,
        marginTop: -5
    },
    imgStyle:{
        width: 90,
        height: 90,
        
    },
    test:{
        position: 'absolute',
        flexDirection: 'row',
        bottom: 10,
        padding: 10,
    },
    button:{
        backgroundColor: 'grey',
        padding: 20,
        width: 90 ,
        justifyContent: 'center',
        marginRight: 20    
    }
})