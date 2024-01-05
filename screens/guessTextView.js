import { Button, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState,useContext } from 'react'
import {StatusContext} from '../context/context'
import { db } from '../components/config'
import { doc, getDoc, setDoc} from 'firebase/firestore'
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, getRelativeCoords, useAnimatedRef, runOnJS } from 'react-native-reanimated'

const GuessTextPage = ({navigation, route}) => {
    const recipeData = route.params?.guessContent
    const statusContext = useContext(StatusContext)
    const [guessOptions, setGuessOptions] = useState([])
    const [showScore, setShowScore] = useState(false)
    const [score, setScore] = useState(null)
    const animatedRef = useAnimatedRef()
    let answers = []

    useEffect (() => {
        const dummyRef = doc(db,"dummyAnswers", "text", )
        async function getDocument(docRef, setFunction){ 
            docSnap = await getDoc(docRef)
                const data = docSnap.data()
                createGuessOptions(data.dummies, recipeData.ingredients)
        }
        getDocument(dummyRef)
    },[])



    function createGuessOptions(dummies, ingredients){
        const dummyCopy = [...dummies]
        dummyCopy.sort((a, b) => 0.5 - Math.random()) //Not true random
        const dummyNumber = Math.floor(Math.random() * ingredients.length/2)+2
        const loops = (dummyCopy.length - dummyNumber)
        if(dummyNumber < dummyCopy.length ){
          for(let i = 0 ; i < loops; i++){
            dummyCopy.pop()
          }   
        const combinedList = [...dummyCopy, ...ingredients]
        combinedList.sort((a, b) => 0.5 - Math.random())
        const updatedList = combinedList.map((n, index) =>  {return {name: n, id: index }})
        setGuessOptions([...updatedList])
        }
    }

    function moveAnswer(coordinates, id){
        if(coordinates.y > 400){   
            if(answers.find((n) => n.id === id) === undefined){
                answers = [...answers, guessOptions.find((n) => n.id === id)]

        }}else{
            if(answers.find((n) => n.id === id) != undefined){
                answers = [...(answers.filter((n) => n.id != id))]
                
        }}
    }

    async function checkAndSubmitAnswers(){
        let rightAnswers = 0
        for(let i = 0; i < recipeData.ingredients.length; i++){
            if(answers.find((n) => n.name === recipeData.ingredients[i]) != undefined){
                rightAnswers++
            }
        }
        let totalAnswers = answers.length
        if(answers.length < recipeData.ingredients.length){
            totalAnswers =  recipeData.ingredients.length
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
       

    const GuessItem = ({guessOption, onMove}) => {

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
                runOnJS(onMove)(coordinates, guessOption.id)
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
                    <Text> {guessOption.name} </Text>
                </Animated.View>
            </PanGestureHandler>
        )

    }




    return (
        <GestureHandlerRootView style={styles.rootView}>
            <View style={styles.container} ref={animatedRef}>
                <View style={styles.answerOptions}>
            {guessOptions.map((option) => (
                    <GuessItem key={option.id} guessOption={option} onMove={moveAnswer}></GuessItem>
                ))}
            </View>
                <Button
                title='Submit'
                onPress={checkAndSubmitAnswers}
                />

                { showScore &&
                <>
                <View style={styles.scoreBox}>
                    <Text>Your score: {score}</Text>
                </View>
                </>
                }

              
            </View>
        </GestureHandlerRootView>



    )
}

export default GuessTextPage

const styles  = StyleSheet.create({
    imgStyle:{
        width: 100,
        height: 100
    },
    container:{
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    answerOptions:{
        flexDirection: 'row', 
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    rootView:{
        flex: 1
    },
    scoreBox:{
        position:'absolute', 
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        width:'100%',
        height: '100%'
    }
})