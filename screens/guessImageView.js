import { StyleSheet, Text, View, Image } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { storage } from '../components/config'
import { StatusContext } from "../context/context"
import { ref, getDownloadURL} from "firebase/storage"
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, getRelativeCoords, useAnimatedRef, runOnJS } from 'react-native-reanimated'


const GuessImagePage = ({navigation, route}) => {
    const guessOptions = {numberOfImages: 5, name: 'Flub', id:4} //route.params?.guessOptions
    const statusContext = useContext(StatusContext)
    const [guessImages, setGuessImages] = useState([])
    const animatedRef = useAnimatedRef() 
    const [showScore, setShowScore] = useState(false)
    const [score, setScore] = useState(null)
    const [trash, setTrash] = useState([])


    useEffect (() => {
        const testValue = createImageList(6, guessOptions.numberOfImages)
        //downloadImages(testValue)
    })

    async function downloadImages(imageData){
        let imageRef = null
        const locationId = statusContext.locationData.id
        imageData.sort((a, b) => 0.5 - Math.random())
        let counter = 0
        for (let image in imageData){
            if(image.type === 'dummy'){
                imageRef = ref(storage, `dummy/${image.id}.jpg`)
            }else{
                imageRef = ref(storage, `${locationId}/${guessOptions.id}/${image.id}.jpg`)
            }
            getDownloadURL(imageRef)
            .then((url) => {
                setGuessImages([...guessImages, {url:url, id:counter++, type:image.type}])
            }).catch((error) => {
            console.log("fejl i image dowload " + error)
            })
        }
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
    
    function moveToTrash(image, coordinates){
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

            const scoreRef = doc(db, "users", statusContext.currentUser.uid, "history", String(statusContext.locationData.id), "scores", String(recipeData.id))
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
                runOnJS(onMove)(coordinates)
                
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
                    <Image source={image.url}></Image>
                </Animated.View>
            </PanGestureHandler>
        )
    }


    return (
        <GestureHandlerRootView style={styles.rootView}>
        <View style={styles.container} ref={animatedRef}>
            <View style={styles.answerOptions}>
                {guessImages.map((image) => (
                <GuessItem key={image.id} image={image} onMove={moveToTrash}></GuessItem>
            ))}
        </View>
            <Button
            title='Submit'
            onPress={checkAndSubmitAnswers}
            />

            { showScore &&
            <>
            <View>
                <Text>Your score: {score}</Text>
            </View>
            </>
            }

          
        </View>
    </GestureHandlerRootView>

    )
}

export default GuessImagePage


const styles  = StyleSheet.create({
    container:{
        flex: 1, 
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    rootView:{
        flex: 1
    },
    answerOptions:{
        flexBasis: '33.333333%'
    }
})