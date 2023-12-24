import MapView, { Marker} from 'react-native-maps'
import { useState, useRef, useEffect } from 'react'
import { getDocs, collection, doc, getDoc } from 'firebase'
import * as Location from 'expo-location'
import { StatusContext } from "../context/context"

const MapPage = ({navigation, route}) => {
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
            key: data.timeStamp,
            title: "titel"
        }
        setMarkers([...markers, newMarker])
    }

    function onMarkerPressed(){

    }

    return( 
        <View style={styles.container}>
            <MapView 
            style={styles.map}
            region={region}
            onLongPress={addMarker}
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
        </View>

    )
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height:'100%'
    }
})