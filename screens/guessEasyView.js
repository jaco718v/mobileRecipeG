import { useState, useRef, useEffect, useContext } from 'react'
import { getDocs, collection, doc, setDoc, updateDoc } from 'firebase/firestore'
import * as Location from 'expo-location'
import { db } from '../components/config'
import { StatusContext } from "../context/context"
import { TouchableOpacity, View, Text, TextInput, StyleSheet } from 'react-native'


const guessEasyPage = ({naviagion, route}) => {
  const guessContent = route.params?.guessContent
  const guessOptionList = guessContent.options
  const guessAnswers = guessContent.answers
  

  return(
    <View>

      <FlatList
            data={guessOptionList}
            renderItem={(recipe) => 
            <Text style={styles.listItem} onPress={()=>{

            }}>
              
            </Text>
            }
        />

    </View>
  )
}