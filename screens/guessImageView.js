import { StyleSheet, Text, View, Image } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { storage } from '../components/config'
import { StatusContext } from "../context/context"
import { ref, getDownloadURL} from "firebase/storage"
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, getRelativeCoords, useAnimatedRef } from 'react-native-reanimated'


const GuessImagePage = ({navigation, route}) => {
    const guessOptions = {numberOfImages: 5, name: 'Flub', id:4} //route.params?.guessOptions
    const statusContext = useContext(StatusContext)
    const [guessImages, setGuessImages] = useState([])
    const animatedRef = useAnimatedRef() 
    


    useEffect (() => {
        const testValue = createImageList(6, guessOptions.numberOfImages)
        //downloadImages(testValue)
    })

    async function downloadImages(imageData){
        let imageRef = null
        const locationId = statusContext.locationData.id
        imageData.sort((a, b) => 0.5 - Math.random())
        for (let image in imageData){
            if(image.type === 'dummy'){
                imageRef = ref(storage, `dummy/${image.id}.jpg`)
            }else{
                imageRef = ref(storage, `${locationId}/${guessOptions.id}/${image.id}.jpg`)
            }
            getDownloadURL(imageRef)
            .then((url) => {
                setGuessImages([...guessImages, {image:url, id:i}])
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
    

    const GuessItem = ({images}) => {

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
                    <Image></Image>
                </Animated.View>
            </PanGestureHandler>
        )

    }


    return (
        <GestureHandlerRootView style={styles.rootView}>
            <View style={styles.container} ref={animatedRef}>
                {guessImages.map((option) => (
                    <GuessItem key={option.id} guessOption={option}></GuessItem>
                ))}
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
        justifyContent: 'center'
    },
    rootView:{
        flex: 1
    }
})