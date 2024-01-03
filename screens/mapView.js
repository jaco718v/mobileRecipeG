import MapView, { Marker} from 'react-native-maps'
import { useState, useRef, useEffect, useContext } from 'react'
import { getDocs, collection, doc, setDoc, updateDoc } from 'firebase/firestore'
import * as Location from 'expo-location'
import { db } from '../components/config'
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
            let { status } = await Location.requestForegroundPermissionsAsync()
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
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005
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
                locationSubscription.current.remove()
            }
        }
    },[] )

    useEffect( () => {
        async function getLocationMarkers(){ //Might not need to be a function + Might be better with snapshot
            await getDocs(collection(db, "locationMarkers"))
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
        await setDoc(doc(db, "locationMarkers", String(newId)),{
            ...newMarker,
        })
        await updateDoc(doc(db,'users' ,statusContext.currentUser.uid),{
            locationId: newId
        })
        statusContext.setAccountData({...statusContext.accountData, locationId:newId})
        setMarkers([...markers, {...newMarker, id:newId}])
        }
        catch(error){
            console.log("sad error : ", error)
        }

    }

    function onMarkerPressed(locationData){
        setShowLocation(true)
        setLocationName(locationData.locationName)
        setLocationDesc(locationData.locationDesc)
        statusContext.setLocationData({...locationData})
        //setProgressBar

    }

    return( 
        <View style={styles.container}>
            <MapView 
            style={styles.map}
            region={region}
            onLongPress={(event) => {
                if(statusContext.accountData.type === true && !statusContext.accountData.locationId)
                addMarker(event)
            }}
            >
                {markers.map(marker => (
                    <Marker
                    coordinate={marker.coordinate}
                    key={marker.key}
                    title={marker.locationName}
                    onPress={() => onMarkerPressed(marker)}
                    />
                ))}
            </MapView>
            

            <View style={styles.optionBar}>
            { statusContext.accountData.type === false &&
            <>
                <Text>Progress</Text>
                <Text>Score</Text>
            </>
            }

            { statusContext.accountData.type === true &&
            <>
                <Text>Edit Recipes</Text>
                <Text>Edit Location</Text>
            </>
            }

            { statusContext.accountData.type === null &&
            <>
                <Text>Log in to unlock additional feaures</Text>
            </>
            }
            </View>

            {showCreate &&
            <>

            <View style={styles.createBox}>
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
            <View style={styles.showBox}>
              <Text>{locationName}</Text>

              <Text>{locationDesc}</Text>

                <TouchableOpacity>
                    <Text style={styles.backgroundText}
                    onPress={() => setShowLocation(!showLocation)}
                    >Close</Text> 
                </TouchableOpacity>

                <TouchableOpacity>
                    <Text style={styles.backgroundText}
                    onPress={() => navigation.navigate("guessListPage")}
                    >Open</Text> 
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
        position: 'absolute',
        flexDirection: 'row',
        height: '5%',
        width: '100%',
        backgroundColor: '#a9c1c8'
    },
    createBox:{
        position: 'absolute',
        height: '30%',
        width: '100%',
        bottom: 0,
        backgroundColor: '#a9c1c8'
    },
    showBox:{
        position: 'absolute',
        height: '30%',
        width: '100%',
        bottom: 0,
        backgroundColor: '#a9c1c8'
    }
})