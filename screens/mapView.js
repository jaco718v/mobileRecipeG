import MapView, { Marker} from 'react-native-maps'
import { useState, useRef, useEffect, useContext } from 'react'
import { getDocs, collection, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'
import * as Location from 'expo-location'
import { StatusContext } from "../context/context"
import { TouchableOpacity, View, Text, TextInput, StyleSheet } from 'react-native'
import { getNextId } from '../util/util'

const MapPage = ({navigation, route}) => {
    const [markerData, setMarkerData] = useState(null)
    const [showLocation, setShowLocation] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [locationName, setLocationName] = useState('Unnamed')
    const [locationDesc, setLocationDesc] = useState('desc')
    const statusContext = useContext(StatusContext)
    const [markers, setMarkers] = useState([])
    const [region, setRegion] = useState({
        latitude: 55,
        longitude: 12,
        latitudeDelta: 20,
        longitudeDelta: 20
    })
    
    const mapView = useRef(null)
    const locationSubscription = useRef(null)


    useEffect( () => {
        async function startListening(){
            let { status } = await Location.requestForegroundPermissionsAsync
            if(status !== 'granted'){
                alert("Denied access to gps")
                return
            }
            locationSubscription.current = await Location.watchPositionAsync({
                distanceInterval: 100,
                accuracy: Location.Accuracy.High
            }, (location) => {
                const newRegion = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 20,
                    longitudeDelta: 20
                }
                setRegion(newRegion)
                if(mapView.current){
                    mapView.current.animateToRegion(newRegion)
                }
            })
        }
        startListening()
        return () => {
            if(locationSubscription.current){
                location.current.remove()
            }
        }
    },[] )

    useEffect( () => {
        async function getLocationMarkers(){ //Might not need to be a function + Might be better with snapshot
            await getDocs(collection(db, "locationsMarkers"))
            .then((n) => { 
                const loadedCollections = []
                n.forEach(doc => {
                const collectionId = doc.id
                const collectionData = doc.data()
                loadedCollections.push({id: collectionId, ...collectionData})
                setMarkers([...loadedCollections])
                })
                console.log("Data loaded")
                })
            .catch((error) => {
                console.log(error)
             });   
        }
        getLocationMarkers()
    },[])


    function addMarker(data){
        const {latitude, longitude} = data.nativeEvent.coordinate
        const markerData = {
            coordinate: {latitude, longitude},
            key: data.timeStamp
        }
        setMarkerData(markerData)
        setShowCreate(true)
    }

    async function createLocation(){
        const newMarker = {
            ...markerData,
            locationName: locationName,
            locationDesc: locationDesc
        }
        let newId = getNextId(markers)
        try{
        await addDoc(doc(db, "locationMarkers"))
        await updateDoc(doc(db,'Users' ,statusContext.currentUser.uid),{
            locationId: newId
        })
        statusContext.setCurrentUser({...statusContext.currentUser, locationId:newId})
        setMarkers({...markers, newMarker})
        }
        catch(error){
            console.log("sad error : ", error)
        }

    }

    function onMarkerPressed(){
        //setShowLocation(true)
    }

    return( 
        <View style={styles.container}>
            <MapView 
            style={styles.map}
            region={region}
            onLongPress={() => {
                if(statusContext.accountData.type === 1 && !statusContext.accountData.locationId)
                addMarker()
            }}
            >
                {markers.map(marker => (
                    <Marker
                    coordinate={marker.coordinate}
                    key={marker.key}
                    title={marker.title}
                    onPress={onMarkerPressed}
                    />
                ))}
            </MapView>
            

            <View style={styles.optionBar}>
            { statusContext.accountData.type == 0 &&
            <>
                <Text>Progress</Text>
                <Text>Score</Text>
            </>
            }

            { statusContext.accountData.type == 1 &&
            <>
                <Text>Edit Recipes</Text>
                <Text>Edit Location</Text>
            </>
            }

            { !statusContext.currentUser.uid &&
            <>
                <Text>Log in in to unlock additional feaures</Text>
            </>
            }
            </View>

            {showCreate &&
            <>

            <View>
                <TextInput
                    onChangeText={newText => setLocationName(newText)}
                    value = {locationName}
                />

                <TextInput
                    onChangeText={newText => setLocationDesc(newText)}
                    value = {locationDesc}
                />

                <TouchableOpacity
                onPress={() => setShowCreate(!showCreate)}
                >
                    <Text style={styles.backgroundText}>Cancel</Text> 
                </TouchableOpacity>

                <TouchableOpacity
                onPress={createLocation}
                >
                    <Text style={styles.backgroundText}>Create</Text> 
                </TouchableOpacity>
            </View>
            </>
            }

            {showLocation &&
            <>
            <View>
              <Text></Text>

              <Text></Text>

                <TouchableOpacity
                onPress={() => setShowCreate(!showLocation)}
                >
                    <Text style={styles.backgroundText}>Close</Text> 
                </TouchableOpacity>

                <TouchableOpacity
                onPress={navigation.navigate("recipeView")}
                >
                    <Text style={styles.backgroundText}>Open</Text> 
                </TouchableOpacity>
            </View>
            </>
            }
        </View>
        
    )
}

export default MapPage

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height:'100%'
    },
    optionBar:{
        flexDirection: 'row',
        height: '10%',
        width: '100%',
        backgroundColor: '#a9c1c8'
    }
})