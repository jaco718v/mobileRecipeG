import MapView, { Marker} from 'react-native-maps'
import { useState, useRef, useEffect } from 'react'
import { getDocs, collection, doc, getDoc, addDoc, updateDoc } from 'firebase'
import * as Location from 'expo-location'
import { StatusContext } from "../context/context"
import { TouchableOpacity } from 'react-native'
import { getNextId } from '../util/util'

const MapPage = ({navigation, route}) => {
    const [newMarkerData, setMarkerData] = useState(null)
    const [showLocation, setShowLocation] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [locationName, setLocationName] = useState('Unnamed')
    const [locationDesc, setLocationDesc] = useState('desc')
    const statusContext = useContext(StatusContext)
    const [markers, setMarkers] = useState([])
    const [region, setRegion] = useState({
        //gps?
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
        async function getLocationMarkers(){ //Might not need to be a function
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
        const newMarker = {
            coordinate: {latitude, longitude},
            key: data.timeStamp
        }
        setMarkerData(newMarker)
        setShowCreate(true)
        //setMarkers([...markers, newMarker])
    }

    async function createLocation(){
        const newMarker = {
            ...newMarkerData,
            locationName: locationName,
            locationDesc: locationDesc
        }
        try{
        await addDoc(doc(db, "locationMarkers"))
        await updateDoc(doc(db,statusContext.currentUser.uid),{
            locationId: getNextId(markers)
        })
        }
        catch(error){
            console.log("sad error : ", error)
        }

    }

    function onMarkerPressed(){

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
                onPress={setShowCreate(!showCreate)}
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
                onPress={setShowCreate(!showLocation)}
                >
                    <Text style={styles.backgroundText}>Close</Text> 
                </TouchableOpacity>

                <TouchableOpacity
                onPress={navigation.navigate("RecipeView")}
                >
                    <Text style={styles.backgroundText}>Open</Text> 
                </TouchableOpacity>
            </View>
            </>
            }
        </View>
        
    )
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height:'100%'
    }
})