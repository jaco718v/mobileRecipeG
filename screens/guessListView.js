import { TouchableOpacity, View, Text, TextInput, StyleSheet } from 'react-native'
import { getDocs, collection, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../components/config'
import { StatusContext } from "../context/context"
import { useState, useEffect, useContext } from 'react'
import { MaterialIcons } from '@expo/vector-icons'

const GuessListView = ({navigation, route}) => {
    const statusContext = useContext(StatusContext)
    const [difficulty, setDifficulty] = useState(false)
    const [easyList, setEasyList] = useState([])
    const [hardList , setHardList] = useState([])
    const list = difficulty? easyList : hardList

    useEffect( () => {
        const scores = statusContext.accountData.scores[statusContext.locationData.id]
        setEasyList((statusContext.locationData.recipes.easy).map((n) => matchRecipeScore(scores, n)))
        setHardList((statusContext.locationData.recipes.hard).map((n) => matchRecipeScore(scores, n)))
    },[])


    function matchRecipeScore(scores, guessRecipe){
        if(scores[guessRecipe.id]){
            return {...guessRecipe, score: scores[guessRecipe.id].score }
        } else {
            return {...guessRecipe, score: 0}
        }
    }

    return(
        <View>

            <TouchableOpacity onPress={() => setDifficulty(false)} >
                <Text>Easy</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDifficulty(true)} >
                <Text>Hard</Text>
            </TouchableOpacity>

            <FlatList
                data={list}
                renderItem={(recipe) => 
                <View>
                    <Text style={styles.listItem} onPress={()=>{
                        if(!recipe.item.score)
                            difficulty? navigation.navigate("guessHardPage", {guessContent: recipe.item}) : navigation.navigate("guessEasyPage", {guessContent: recipe.item}) }}>
                        {recipe.item.name} 
                    </Text>
                    {   recipe.item.score &&
                        <>
                        <Text>{recipe.item.score}</Text>
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