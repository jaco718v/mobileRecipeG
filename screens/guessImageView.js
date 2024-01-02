import { StyleSheet, Text, View, Image } from 'react-native-web'
import { useState } from 'react'
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, getRelativeCoords, useAnimatedRef } from 'react-native-reanimated'

const GuessImagePage = ({navigation, route}) => {
    const [guessOptions, setGuessOptions] = useState([])
    const animatedRef = useAnimatedRef() // <Animated.View ref={animatedRef} /> mb

    const GuessItem = ({guessOption}) => {

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
                testValue = getRelativeCoords(animatedRef, event.absoluteX, event.absoluteY)
                console.log(testValue)
                //Logic here
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
                    <Text>{guessOption}</Text>
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