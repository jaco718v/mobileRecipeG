import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useEffect, useState,useContext } from 'react'
import {StatusContext} from '../context/context'
import { db } from '../components/config'
import { doc, getDoc, setDoc, updateDoc} from 'firebase/firestore'
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, getRelativeCoords, useAnimatedRef, runOnJS } from 'react-native-reanimated'
import { successToast, errorToast } from '../util/util';

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
        async function getDocument(docRef){ 
            docSnap = await getDoc(docRef)
                const data = docSnap.data()
                createGuessOptions(data.dummies, recipeData.ingredients)
        }
        try{
            getDocument(dummyRef)
        } catch{
            errorToast("Error while getting quiz-data")
        }
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
        if(coordinates.y > 380){   
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
    
        const _score = Math.floor((rightAnswers / totalAnswers )*100)
        
        setShowScore(true)
        setScore(_score)


        console.log(statusContext.accountData.type)
        setTimeout(async () => {
            if(statusContext.accountData.type !== null){
                const scoreRef = doc(db, "users", statusContext.currentUser.uid, "history", String(statusContext.locationData.id), "scores", String(recipeData.id))
                await setDoc(scoreRef,{
                    score: _score,
                    hasImage:false
                })
                const userRef = doc(db, "users", statusContext.currentUser.uid)
                await updateDoc(userRef,{
                    totalScore: statusContext.accountData.totalScore + _score,
                })
                statusContext.accountData.totalScore = statusContext.accountData.totalScore + _score
            }
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
                    <Text style={styles.answerText}> {guessOption.name} </Text>
                </Animated.View>
            </PanGestureHandler>
        )

    }




    return (
        <GestureHandlerRootView style={styles.rootView}>
            <View style={styles.container} ref={animatedRef}>

                <View style={styles.answerOptions}>

                <Text style = {styles.titleText}> Drag items from a {recipeData.name} to green</Text>

            {guessOptions.map((option) => (
                    <GuessItem key={option.id} guessOption={option} onMove={moveAnswer}></GuessItem>
                ))}
            </View>

            <View style={{flex:1}}>
            <TouchableOpacity
                style={styles.button}
                onPress={checkAndSubmitAnswers}>
                    <Text style={{fontWeight: 'bold', fontSize: 18}}>Finish</Text>
                </TouchableOpacity>

                { showScore &&
                <>
                <View style={styles.scoreBox}>
                    <Text>Your score: {score}</Text>
                </View>
                </>
                }
            </View>
              
            </View>
        </GestureHandlerRootView>



    )
}

export default GuessTextPage

const styles  = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: "#75A778",
        justifyContent: 'center'
    },
    answerOptions:{
        flex: 1,
        flexWrap: 'wrap',
        flexDirection: 'row', 
        padding: 25 ,
        backgroundColor: '#DE7775',
        
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
    },
    answerText:{
        backgroundColor: 'transparent',
        fontSize: 16,
        fontWeight: 'bold'
    },
    titleText:{
        
        paddingBottom: 30,
        fontSize:16,
        width: '100%',
        textDecorationLine: "underline",
        textDecorationStyle: "solid"
    },
    button:{
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: '#2293bb',
        padding: 5,
        height:45,
        width: 339,
        bottom:0,
        textAlign: 'center',
        borderTopColor: "black",
        borderTopWidth: 2,
        borderRightColor: "black",
        borderRightWidth: 1,
        borderLeftColor: "black",
        borderLeftWidth: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    }
})
