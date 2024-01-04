import { StyleSheet, Text, View, Image } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { StatusContext } from "../context/context"
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, getRelativeCoords, useAnimatedRef } from 'react-native-reanimated'


const GuessImagePage = ({navigation, route}) => {
    const guessOptions = {numberOfImages: 5, name: 'Flub', id:4} //route.params?.guessOptions
    const statusContext = useContext(StatusContext)
    const [guessImages, setGuessImages] = useState([])
    const animatedRef = useAnimatedRef() 
    const [images, setImages] = useState([])


    useEffect (() => {
        downloadImages()
    })

    async function downloadImages(){
        const locationId = statusContext.locationData.id
            for(let i = 0; i<guessOptions.numberOfImages; i++){
            getDownloadURL(ref(storage, `${locationId}/${guessOptions.id}/${i}.jpg`))
            .then((url) => {
                setImages([...imagePaths, {image:url, id:i}])
            }).catch((error) => {
            console.log("fejl i image dowload " + error)
            })
        }
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
                {guessOptions.map((option) => (
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