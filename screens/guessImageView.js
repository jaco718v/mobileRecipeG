import { StyleSheet, Text, View, Image, TouchableOpacity, Button } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { storage, db } from '../components/config'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { StatusContext } from "../context/context"
import { ref, getDownloadURL} from "firebase/storage"
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, getRelativeCoords, useAnimatedRef, runOnJS } from 'react-native-reanimated'
import { SimpleLineIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import { successToast, errorToast } from '../util/util';

const GuessImagePage = ({navigation, route}) => {
    const guessOptions = route.params?.guessContent
    const statusContext = useContext(StatusContext)
    const [guessImages, setGuessImages] = useState([])
    const animatedRef = useAnimatedRef() 
    const [showScore, setShowScore] = useState(false)
    const [score, setScore] = useState(null)
    const [trash, setTrash] = useState([])


    useEffect (() => {
        const totalDummies = 6
        const mixedArray = createImageList(totalDummies, guessOptions.numberOfImages)
        try{
            downloadImages(mixedArray)
        }
        catch(error){
            errorToast("Error in getting images")
        }
        
    },[])

    async function downloadImages(imageData){
        let imageRef = null
        const locationId = statusContext.locationData.id
        let counter = 0
        let imageList = []
        for (let image of imageData){
            if(image.type === 'dummy'){
                imageRef = ref(storage, `dummy-${image.id}.jpg`)
            }else{
                imageRef = ref(storage, `ingredient-${locationId}-${guessOptions.id}-${image.id}.jpg`)}
            const singleImage = await getDownloadURL(imageRef)
            imageList = [...imageList, {url:singleImage, id:counter++, type:image.type, visible: true}]
        
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
        if(image.visible){
            setTrash([...trash, {...image}])
            setGuessImages(guessImages.map((n) => n.id === image.id ? {...n, visible:false} : n)) }
    }

    function undoTrash(){
        if(trash.length > 0 ){ 
            const firstIndex = {...trash[trash.length-1]}
            setGuessImages(guessImages.map((n) => n.id === firstIndex.id ? {...n, visible:true} : n))
            setTrash(prevImages => prevImages.filter((n) => n.id != firstIndex.id))
        }
    }

    async function checkAndSubmitAnswers(){
        let rightAnswers = 0
        let totalAnswers = 0
        for( const image of guessImages){
            if(image.type === 'real' && image.visible){
                rightAnswers++
            } 
            if(image.visible){
                totalAnswers++
            }
        } 

        console.log( rightAnswers, totalAnswers)

        if(totalAnswers < guessOptions.numberOfImages){
            totalAnswers =  guessOptions.numberOfImages
        }

        const _score = Math.floor((rightAnswers / totalAnswers )*100)
        
        setShowScore(true)
        setScore(_score)

        setTimeout(async () => {
            if(statusContext.accountData.type !== null){
                const scoreRef = doc(db, "users", statusContext.currentUser.uid, "history", String(statusContext.locationData.id), "scores", String(guessOptions.id))
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
                if(coordinates.x > 20 && coordinates.x < 150 && coordinates.y > 500){
                    runOnJS(onMove)(image)
                } else {
                    translateX.value = withSpring(0)
                    translateY.value = withSpring(0)
                }
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
                    <View style={image.visible? styles.answerOptions : styles.answerInvisible}>
                        <Image source={{uri:image.url}} style={styles.imgStyle}></Image>
                    </View>
                </Animated.View>
            </PanGestureHandler>
        )
    }


    return (
        <GestureHandlerRootView style={styles.rootView}>
        <View style={styles.container} ref={animatedRef}>
            
            <Text style = {styles.titleText}> Drag items not in a {guessOptions.name} to trash</Text>

            {guessImages.map((image) => (
                <GuessItem key={image.id} image={image} onMove={moveToTrash}></GuessItem>
            ))}
            
            <View style={styles.buttonRow}>

            { !showScore &&
                <>
                
                <SimpleLineIcons name="trash" size={100} color="black" paddingRight={5}/>
            
                <TouchableOpacity style={styles.button} onPress={undoTrash}>
                    <FontAwesome name="undo" size={60} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.button}
                onPress={checkAndSubmitAnswers}>
                    <Ionicons name="checkmark" size={50} color="black" />
                </TouchableOpacity>
                </>
            }



                { showScore &&
                <>
                <View >
                    <Text style={styles.scoreText}>Your score: {score}</Text>

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
        backgroundColor: "#a1e0e9",
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    titleText:{
        position: 'absolute',
        width: '100%',
        top:10,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 'bold',
        textDecorationLine: "underline",
        textDecorationStyle: "solid"
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
    answerInvisible:{
        flexBasis: '29.4%',
        top: -20,
        flexGrow: 0, 
        flexShrink: 0,                     
        paddingRight: 10,
        paddingLeft: 10,
        paddingBottom: -10,
        marginBottom: -20,
        marginTop: -5,
        opacity: 0
    },
    imgStyle:{
        width: 90,
        height: 90, 
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "black",   
    },
    buttonRow:{
        position: 'absolute',
        flexDirection: 'row',
        bottom: 10,
        padding: 10,
    },
    button:{
        backgroundColor: '#2293bb',
        padding: 20,
        width: 95 ,
        justifyContent: 'center',
        marginRight: 20,
        borderRadius: 8,
        borderColor: "black",
        borderWidth: 2,   
    },
    scoreText:{
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        bottom: 40,
        left: 40
    }
})